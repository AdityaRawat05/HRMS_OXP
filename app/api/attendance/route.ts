import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  formatAttendancePayload,
  calculateWorkedAndOvertime,
  logAttendanceAudit,
} from "@/lib/attendance";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * GET /api/attendance
 * List attendance records with search, date filter, employee filter, status filter, and pagination.
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const dateParam = searchParams.get("date") || searchParams.get("attendance_date");
    const employeeIdParam = searchParams.get("employeeId") || searchParams.get("employee_id");
    const statusParam = searchParams.get("status");
    const pageRaw = searchParams.get("page");
    const limitRaw = searchParams.get("limit");

    let page = parseInt(pageRaw || "1", 10);
    if (isNaN(page) || page < 1) page = 1;

    let limit = parseInt(limitRaw || "50", 10);
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Non-admin scope check: regular employees can only view their own attendance
    if (!session.isAdmin) {
      const emp = await prisma.employees.findFirst({
        where: { user_id: session.user.id },
      });
      if (!emp) {
        return jsonCorsResponse(
          { success: true, data: [], meta: { total: 0, page, limit, totalPages: 1 } },
          { status: 200 },
          req
        );
      }
      where.employee_id = emp.id;
    } else if (employeeIdParam) {
      const eId = parseInt(employeeIdParam, 10);
      if (!isNaN(eId)) {
        where.employee_id = eId;
      }
    }

    // Date filter
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        where.attendance_date = parsedDate;
      }
    }

    // Status filter
    if (statusParam && statusParam !== "all") {
      where.status = statusParam;
    }

    // Search condition
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { employees: { first_name: { contains: q } } },
        { employees: { last_name: { contains: q } } },
        { employees: { work_email: { contains: q } } },
        { employees: { employee_code: { contains: q } } },
        { employees: { departments_employees_department_idTodepartments: { name: { contains: q } } } },
        { correction_reason: { contains: q } },
      ];
    }

    const [totalCount, records] = await Promise.all([
      prisma.attendance_records.count({ where }),
      prisma.attendance_records.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ attendance_date: "desc" }, { id: "desc" }],
        include: {
          employees: {
            include: {
              departments_employees_department_idTodepartments: true,
              employees: true,
            },
          },
        },
      }),
    ]);

    const formatted = records.map(formatAttendancePayload);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return jsonCorsResponse(
      {
        success: true,
        data: formatted,
        meta: {
          total: totalCount,
          page,
          limit,
          totalPages,
        },
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("GET /api/attendance error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * POST /api/attendance
 * Create or manually log an attendance record (Admin/HR feature).
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid JSON body" }, { status: 400 }, req);
    }

    const {
      employee_id,
      attendance_date,
      check_in,
      check_out,
      status,
      worked_hours,
      overtime_hours,
      break_hours,
      correction_reason,
      notes,
      source,
    } = body;

    // Validate employee_id
    const empId = parseInt(String(employee_id), 10);
    if (isNaN(empId) || empId <= 0) {
      return jsonCorsResponse({ success: false, error: "Valid employee_id is required." }, { status: 422 }, req);
    }

    const employee = await prisma.employees.findUnique({
      where: { id: empId },
    });

    if (!employee) {
      return jsonCorsResponse({ success: false, error: `Employee with ID ${empId} not found.` }, { status: 404 }, req);
    }

    // Validate check_in & attendance_date
    if (!check_in) {
      return jsonCorsResponse({ success: false, error: "Check-in time is required." }, { status: 422 }, req);
    }

    const checkInDate = new Date(check_in);
    if (isNaN(checkInDate.getTime())) {
      return jsonCorsResponse({ success: false, error: "Invalid check_in timestamp." }, { status: 422 }, req);
    }

    let checkOutDate: Date | null = null;
    if (check_out) {
      checkOutDate = new Date(check_out);
      if (isNaN(checkOutDate.getTime())) {
        return jsonCorsResponse({ success: false, error: "Invalid check_out timestamp." }, { status: 422 }, req);
      }
      if (checkOutDate.getTime() < checkInDate.getTime()) {
        return jsonCorsResponse(
          { success: false, error: "Check-out cannot be before check-in." },
          { status: 422 },
          req
        );
      }
    }

    const attDate = attendance_date
      ? new Date(attendance_date)
      : new Date(checkInDate.toISOString().split("T")[0]);

    if (isNaN(attDate.getTime())) {
      return jsonCorsResponse({ success: false, error: "Invalid attendance_date." }, { status: 422 }, req);
    }

    // Check unique constraint (employee_id, attendance_date)
    const existing = await prisma.attendance_records.findFirst({
      where: {
        employee_id: empId,
        attendance_date: attDate,
      },
    });

    if (existing) {
      return jsonCorsResponse(
        { success: false, error: `Attendance record already exists for this employee on ${attDate.toISOString().split("T")[0]}.` },
        { status: 409 },
        req
      );
    }

    const bHours = parseFloat(String(break_hours ?? 0)) || 0;
    if (bHours < 0) {
      return jsonCorsResponse({ success: false, error: "Break hours cannot be negative." }, { status: 422 }, req);
    }

    let calculatedWorked = worked_hours !== undefined && worked_hours !== null ? parseFloat(String(worked_hours)) : null;
    let calculatedOvertime = overtime_hours !== undefined && overtime_hours !== null ? parseFloat(String(overtime_hours)) : 0;

    if (checkOutDate && (calculatedWorked === null || isNaN(calculatedWorked))) {
      const calc = calculateWorkedAndOvertime(checkInDate, checkOutDate, bHours);
      calculatedWorked = calc.workedHours;
      calculatedOvertime = calc.overtimeHours;
    }

    const validStatus = status || (calculatedWorked !== null && calculatedWorked < 4 ? "half_day" : "present");
    const reasonText = correction_reason || notes || null;

    const newRecord = await prisma.attendance_records.create({
      data: {
        employee_id: empId,
        attendance_date: attDate,
        check_in: checkInDate,
        check_out: checkOutDate,
        worked_hours: calculatedWorked !== null ? Math.max(0, calculatedWorked) : null,
        overtime_hours: Math.max(0, calculatedOvertime),
        break_hours: Math.max(0, bHours),
        status: validStatus,
        is_manually_corrected: Boolean(reasonText),
        corrected_by: reasonText ? auth.sessionData.user.id : null,
        correction_reason: reasonText,
        source: source || "manual",
      },
    });

    await logAttendanceAudit(auth.sessionData.user.id, "CREATE", newRecord.id, null, newRecord);

    const fullRecord = await prisma.attendance_records.findUnique({
      where: { id: newRecord.id },
      include: {
        employees: {
          include: {
            departments_employees_department_idTodepartments: true,
            employees: true,
          },
        },
      },
    });

    return jsonCorsResponse(
      {
        success: true,
        data: formatAttendancePayload(fullRecord),
      },
      { status: 201 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/attendance error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

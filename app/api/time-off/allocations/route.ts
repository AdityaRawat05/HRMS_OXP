import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  formatTimeOffAllocationPayload,
  getUserManagedEmployeeIds,
  logTimeOffAudit,
} from "@/lib/time-off";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * GET /api/time-off/allocations
 * List time off allocations with search, employee, type, and status filters.
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const employeeIdParam = searchParams.get("employeeId") || searchParams.get("employee_id");
    const timeOffTypeIdParam = searchParams.get("timeOffTypeId") || searchParams.get("time_off_type_id");
    const statusParam = searchParams.get("status") || searchParams.get("state");
    const isMyTeam = searchParams.get("myTeam") === "true" || searchParams.get("is_my_team") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const userEmployee = await prisma.employees.findFirst({
      where: {
        OR: [
          { user_id: session.user.id },
          { work_email: session.user.email },
        ],
      },
    });

    const where: any = {};

    if (isMyTeam) {
      const managedIds = await getUserManagedEmployeeIds(session.user.id);
      where.employee_id = { in: managedIds };
    } else if (!session.isAdmin) {
      if (userEmployee) {
        where.employee_id = userEmployee.id;
      } else {
        return jsonCorsResponse(
          {
            success: true,
            data: [],
            pagination: { page: 1, limit, total: 0, totalPages: 0 },
          },
          { status: 200 },
          req
        );
      }
    }

    if (employeeIdParam) {
      const empId = parseInt(employeeIdParam, 10);
      if (!isNaN(empId)) {
        if (!session.isAdmin && userEmployee && userEmployee.id !== empId) {
          const managedIds = await getUserManagedEmployeeIds(session.user.id);
          if (!managedIds.includes(empId)) {
            return jsonCorsResponse(
              { success: false, error: "Unauthorized to view allocations for this employee." },
              { status: 403 },
              req
            );
          }
        }
        where.employee_id = empId;
      }
    }

    if (timeOffTypeIdParam) {
      const typeId = parseInt(timeOffTypeIdParam, 10);
      if (!isNaN(typeId)) {
        where.time_off_type_id = typeId;
      }
    }

    if (statusParam && statusParam !== "all") {
      where.state = statusParam;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { notes: { contains: q } },
        { time_off_types: { name: { contains: q } } },
        {
          employees: {
            OR: [
              { first_name: { contains: q } },
              { last_name: { contains: q } },
              { employee_code: { contains: q } },
            ],
          },
        },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.time_off_allocations.count({ where }),
      prisma.time_off_allocations.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ created_at: "desc" }],
        include: {
          employees: true,
          time_off_types: true,
          users: true,
        },
      }),
    ]);

    const formattedData = records.map(formatTimeOffAllocationPayload);

    return jsonCorsResponse(
      {
        success: true,
        data: formattedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("GET /api/time-off/allocations error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * POST /api/time-off/allocations
 * Create a new leave allocation for an employee.
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    if (!session.isAdmin) {
      return jsonCorsResponse(
        { success: false, error: "Unauthorized. Only HR/Admin can create leave allocations." },
        { status: 403 },
        req
      );
    }

    const body = await req.json();
    const {
      employee_id,
      employeeId,
      time_off_type_id,
      timeOffTypeId,
      allocation_type,
      allocationType,
      allocated_days,
      allocatedDays,
      validity_start,
      validityStart,
      validity_end,
      validityEnd,
      notes,
      state,
    } = body;

    const targetEmpId = parseInt(employee_id || employeeId, 10);
    const targetTypeId = parseInt(time_off_type_id || timeOffTypeId, 10);
    const numDays = parseFloat(allocated_days || allocatedDays);
    const rawValStart = validity_start || validityStart;
    const rawValEnd = validity_end || validityEnd;

    if (!targetEmpId || isNaN(targetEmpId)) {
      return jsonCorsResponse(
        { success: false, error: "Employee ID is required." },
        { status: 422 },
        req
      );
    }

    if (!targetTypeId || isNaN(targetTypeId)) {
      return jsonCorsResponse(
        { success: false, error: "Time Off Type ID is required." },
        { status: 422 },
        req
      );
    }

    if (isNaN(numDays) || numDays <= 0) {
      return jsonCorsResponse(
        { success: false, error: "Allocated days must be a positive number." },
        { status: 422 },
        req
      );
    }

    if (!rawValStart || !rawValEnd) {
      return jsonCorsResponse(
        { success: false, error: "Validity start date and end date are required." },
        { status: 422 },
        req
      );
    }

    const valStart = new Date(rawValStart);
    const valEnd = new Date(rawValEnd);

    if (isNaN(valStart.getTime()) || isNaN(valEnd.getTime())) {
      return jsonCorsResponse(
        { success: false, error: "Invalid date format for validity range." },
        { status: 422 },
        req
      );
    }

    if (valEnd < valStart) {
      return jsonCorsResponse(
        { success: false, error: "Validity end date cannot be before validity start date." },
        { status: 422 },
        req
      );
    }

    // Verify employee
    const emp = await prisma.employees.findUnique({ where: { id: targetEmpId } });
    if (!emp || !emp.is_active) {
      return jsonCorsResponse(
        { success: false, error: "Employee not found or inactive." },
        { status: 404 },
        req
      );
    }

    // Verify Time Off Type
    const leaveType = await prisma.time_off_types.findUnique({ where: { id: targetTypeId } });
    if (!leaveType || !leaveType.is_active) {
      return jsonCorsResponse(
        { success: false, error: "Time Off Type not found or inactive." },
        { status: 404 },
        req
      );
    }

    const allocTypeEnum = (allocation_type || allocationType || "annual") as any;
    const allocState = (state && ["draft", "approved", "refused", "cancelled"].includes(state)) ? state : "approved";

    const newAllocation = await prisma.time_off_allocations.create({
      data: {
        employee_id: targetEmpId,
        time_off_type_id: targetTypeId,
        allocation_type: allocTypeEnum,
        allocated_days: numDays,
        used_days: 0.0,
        validity_start: valStart,
        validity_end: valEnd,
        state: allocState,
        approved_by: allocState === "approved" ? session.user.id : null,
        approved_at: allocState === "approved" ? new Date() : null,
        notes: notes ? String(notes).trim() : null,
        created_by: session.user.id,
      },
      include: {
        employees: true,
        time_off_types: true,
        users: true,
      },
    });

    await logTimeOffAudit(
      session.user.id,
      "CREATE_ALLOCATION",
      "time_off_allocations",
      newAllocation.id,
      null,
      { employee_id: targetEmpId, time_off_type_id: targetTypeId, allocated_days: numDays, state: allocState }
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time off allocation created successfully.",
        data: formatTimeOffAllocationPayload(newAllocation),
      },
      { status: 201 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/time-off/allocations error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

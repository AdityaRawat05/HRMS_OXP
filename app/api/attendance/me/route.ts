import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  formatAttendancePayload,
  formatDurationHuman,
  formatTimeHHMM,
} from "@/lib/attendance";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * GET /api/attendance/me
 * Returns attendance widget payload for the authenticated employee.
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    // Find authenticated employee record
    const employee = await prisma.employees.findFirst({
      where: {
        OR: [
          { user_id: session.user.id },
          { work_email: session.user.email },
        ],
      },
      include: {
        departments_employees_department_idTodepartments: true,
        employees: true,
      },
    });

    if (!employee) {
      return jsonCorsResponse(
        {
          success: false,
          error: "No employee record associated with current logged in user.",
        },
        { status: 404 },
        req
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const todayDate = new Date(todayStr);

    // Find active check-in (check_out is null) OR today's record
    const todayRecord = await prisma.attendance_records.findFirst({
      where: {
        employee_id: employee.id,
        OR: [
          { check_out: null },
          { attendance_date: todayDate },
        ],
      },
      orderBy: [{ check_in: "desc" }],
      include: {
        employees: {
          include: {
            departments_employees_department_idTodepartments: true,
            employees: true,
          },
        },
      },
    });

    const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
    const departmentName = employee.departments_employees_department_idTodepartments?.name || "Unassigned";

    if (!todayRecord) {
      return jsonCorsResponse(
        {
          success: true,
          data: {
            authenticated_employee: {
              id: employee.id,
              name: fullName,
              employee_code: employee.employee_code,
              work_email: employee.work_email,
              department: departmentName,
            },
            current_status: "not_checked_in",
            is_checked_in: false,
            check_in: null,
            check_in_time: "—",
            check_out: null,
            check_out_time: "—",
            today_worked_hours: 0,
            running_worked_hours: 0,
            running_worked_hours_display: "0h 00m",
            today_record: null,
          },
        },
        { status: 200 },
        req
      );
    }

    const formattedPayload = formatAttendancePayload(todayRecord);
    const isCheckedIn = !todayRecord.check_out;

    let currentStatus = "not_checked_in";
    if (isCheckedIn) {
      currentStatus = "checked_in";
    } else {
      currentStatus = "checked_out";
    }

    return jsonCorsResponse(
      {
        success: true,
        data: {
          authenticated_employee: {
            id: employee.id,
            name: fullName,
            employee_code: employee.employee_code,
            work_email: employee.work_email,
            department: departmentName,
          },
          current_status: currentStatus,
          is_checked_in: isCheckedIn,
          check_in: formattedPayload.check_in,
          check_in_time: formattedPayload.check_in_time,
          check_out: formattedPayload.check_out,
          check_out_time: formattedPayload.check_out_time,
          today_worked_hours: formattedPayload.worked_hours || formattedPayload.running_worked_hours,
          running_worked_hours: formattedPayload.running_worked_hours,
          running_worked_hours_display: formattedPayload.running_worked_hours_display,
          status: formattedPayload.status,
          status_display: formattedPayload.status_display,
          today_record: formattedPayload,
        },
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("GET /api/attendance/me error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

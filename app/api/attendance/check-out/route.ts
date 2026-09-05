import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
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
 * POST /api/attendance/check-out
 * Quick check-out for authenticated employee.
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    // Identify authenticated employee
    const employee = await prisma.employees.findFirst({
      where: {
        OR: [
          { user_id: session.user.id },
          { work_email: session.user.email },
        ],
      },
    });

    if (!employee) {
      return jsonCorsResponse(
        { success: false, error: "No employee profile found for logged in user." },
        { status: 404 },
        req
      );
    }

    // Find open attendance record (check_out is null)
    const activeAttendance = await prisma.attendance_records.findFirst({
      where: {
        employee_id: employee.id,
        check_out: null,
      },
      orderBy: [{ check_in: "desc" }],
    });

    if (!activeAttendance) {
      return jsonCorsResponse(
        { error: "No active attendance record found." },
        { status: 409 },
        req
      );
    }

    const now = new Date();
    const breakHours = Number(activeAttendance.break_hours || 0);

    const { workedHours, overtimeHours } = calculateWorkedAndOvertime(
      activeAttendance.check_in,
      now,
      breakHours,
      8.0
    );

    let finalStatus = activeAttendance.status;
    if (workedHours < 4 && workedHours > 0) {
      finalStatus = "half_day";
    }

    const updatedRecord = await prisma.attendance_records.update({
      where: { id: activeAttendance.id },
      data: {
        check_out: now,
        worked_hours: workedHours,
        overtime_hours: overtimeHours,
        status: finalStatus,
        updated_at: now,
      },
    });

    await logAttendanceAudit(
      session.user.id,
      "CHECK_OUT",
      activeAttendance.id,
      activeAttendance,
      updatedRecord
    );

    const fullRecord = await prisma.attendance_records.findUnique({
      where: { id: updatedRecord.id },
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
        message: "Checked out successfully.",
        data: formatAttendancePayload(fullRecord),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/attendance/check-out error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

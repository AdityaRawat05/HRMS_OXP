import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  formatAttendancePayload,
  logAttendanceAudit,
} from "@/lib/attendance";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * POST /api/attendance/check-in
 * Quick check-in for authenticated employee.
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
      include: {
        employee_contracts: {
          where: { state: "active" },
          include: {
            working_schedules: {
              include: {
                working_schedule_lines: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return jsonCorsResponse(
        { success: false, error: "No employee profile found for logged in user." },
        { status: 404 },
        req
      );
    }

    // Check if employee ALREADY has an open check-in (check_out is null)
    const activeCheckIn = await prisma.attendance_records.findFirst({
      where: {
        employee_id: employee.id,
        check_out: null,
      },
    });

    if (activeCheckIn) {
      return jsonCorsResponse(
        { error: "Employee is already checked in." },
        { status: 409 },
        req
      );
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const todayDate = new Date(todayStr);

    // Check if record for today already exists and has checkout (prevent multiple daily checkins if restricted, or reopen)
    const existingToday = await prisma.attendance_records.findFirst({
      where: {
        employee_id: employee.id,
        attendance_date: todayDate,
      },
    });

    if (existingToday && existingToday.check_out !== null) {
      return jsonCorsResponse(
        { error: "Employee has already checked out for today. Multiple check-ins require manager correction." },
        { status: 409 },
        req
      );
    }

    // Determine status (check if late based on working schedule line for current day of week)
    let initialStatus: "present" | "late" = "present";
    let isLate = false;
    let lateMins = 0;

    const dayOfWeek = (now.getDay() + 6) % 7; // Convert JS Sun(0)-Sat(6) to Mon(0)-Sun(6)
    const activeContract = employee.employee_contracts[0];
    const schedule = activeContract?.working_schedules;
    const scheduleLine = schedule?.working_schedule_lines.find((l) => l.day_of_week === dayOfWeek);

    if (scheduleLine && scheduleLine.is_working_day && scheduleLine.start_time) {
      const shiftStart = new Date(scheduleLine.start_time);
      const shiftStartMins = shiftStart.getUTCHours() * 60 + shiftStart.getUTCMinutes();
      const actualCheckInMins = now.getHours() * 60 + now.getMinutes();

      if (actualCheckInMins > shiftStartMins + 15) { // 15 mins grace period
        initialStatus = "late";
        isLate = true;
        lateMins = actualCheckInMins - shiftStartMins;
      }
    }

    const createdRecord = await prisma.attendance_records.create({
      data: {
        employee_id: employee.id,
        attendance_date: todayDate,
        check_in: now,
        check_out: null,
        status: initialStatus,
        is_late: isLate,
        late_minutes: lateMins,
        source: "web",
      },
    });

    await logAttendanceAudit(session.user.id, "CHECK_IN", createdRecord.id, null, createdRecord);

    const fullRecord = await prisma.attendance_records.findUnique({
      where: { id: createdRecord.id },
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
        message: "Checked in successfully.",
        data: formatAttendancePayload(fullRecord),
      },
      { status: 201 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/attendance/check-in error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

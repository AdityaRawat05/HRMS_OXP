import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  DAY_NAMES,
  parseTimeStringToDate,
  calculateNetHours,
  formatLinePayload,
  recalculateScheduleHours,
  logAuditAction,
} from "@/lib/working-schedules";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}


/**
 * POST /api/working-schedules/[id]/lines
 * Add a day / line to the working schedule.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const scheduleId = parseInt(params.id, 10);
    if (isNaN(scheduleId) || scheduleId <= 0) {
      return jsonCorsResponse({ success: false, error: "Invalid schedule ID" }, { status: 400 }, req);
    }

    const schedule = await prisma.working_schedules.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      return jsonCorsResponse({ success: false, error: "Working schedule not found" }, { status: 404 }, req);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid JSON body" }, { status: 400 }, req);
    }

    let dayOfWeek = typeof body.day_of_week === "number" ? body.day_of_week : -1;
    let dayName = body.day_name || body.day || "";

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      if (dayName) {
        const idx = DAY_NAMES.findIndex(
          (d) => d.toLowerCase() === String(dayName).trim().toLowerCase()
        );
        if (idx >= 0) dayOfWeek = idx;
      }
    }

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return jsonCorsResponse(
        { success: false, error: "Valid day_of_week (0-6) or day_name (e.g. 'Monday') is required." },
        { status: 422 },
        req
      );
    }

    if (!dayName) {
      dayName = DAY_NAMES[dayOfWeek];
    }

    // Check unique constraint for (working_schedule_id, day_of_week)
    const existingLine = await prisma.working_schedule_lines.findFirst({
      where: {
        working_schedule_id: scheduleId,
        day_of_week: dayOfWeek,
      },
    });

    if (existingLine) {
      return jsonCorsResponse(
        { success: false, error: `Schedule line for ${dayName} (day ${dayOfWeek}) already exists in this schedule.` },
        { status: 409 },
        req
      );
    }

    const isWorkingDay = body.is_working_day !== undefined ? Boolean(body.is_working_day) : true;
    const breakMins = parseInt(String(body.break_duration_minutes ?? body.break ?? 60), 10) || 0;

    if (breakMins < 0) {
      return jsonCorsResponse(
        { success: false, error: "Break duration cannot be negative." },
        { status: 422 },
        req
      );
    }

    const startStr = body.start_time || "09:00";
    const endStr = body.end_time || "18:00";
    const startDate = parseTimeStringToDate(startStr);
    const endDate = parseTimeStringToDate(endStr);

    const netHours = calculateNetHours(startDate, endDate, breakMins, isWorkingDay);

    if (netHours < 0) {
      return jsonCorsResponse(
        { success: false, error: "Calculated net hours cannot be negative." },
        { status: 422 },
        req
      );
    }

    const newLine = await prisma.working_schedule_lines.create({
      data: {
        working_schedule_id: scheduleId,
        day_of_week: dayOfWeek,
        day_name: dayName,
        start_time: startDate,
        end_time: endDate,
        break_duration_minutes: breakMins,
        is_working_day: isWorkingDay,
      },
    });

    // Recalculate total weekly hours for the schedule
    const newTotalWeeklyHours = await recalculateScheduleHours(scheduleId);

    await logAuditAction(
      auth.sessionData.user.id,
      "ADD_LINE",
      scheduleId,
      null,
      { line_id: newLine.id, day: dayName, net_hours: netHours, newTotalWeeklyHours }
    );

    return jsonCorsResponse(
      {
        success: true,
        data: formatLinePayload(newLine),
        total_weekly_hours: newTotalWeeklyHours,
      },
      { status: 201 },
      req
    );
  } catch (error: any) {
    console.error(`POST /api/working-schedules/${params.id}/lines error:`, error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

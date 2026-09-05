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
 * PATCH /api/working-schedules/[id]/lines/[lineId]
 * Update a schedule line (day, times, break, active working day state).
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const scheduleId = parseInt(params.id, 10);
    const lineId = parseInt(params.lineId, 10);

    if (isNaN(scheduleId) || scheduleId <= 0 || isNaN(lineId) || lineId <= 0) {
      return jsonCorsResponse({ success: false, error: "Invalid schedule ID or line ID" }, { status: 400 }, req);
    }

    const line = await prisma.working_schedule_lines.findUnique({
      where: { id: lineId },
    });

    if (!line || line.working_schedule_id !== scheduleId) {
      return jsonCorsResponse(
        { success: false, error: "Schedule line not found for this schedule." },
        { status: 404 },
        req
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid JSON body" }, { status: 400 }, req);
    }

    const updateData: any = {};

    let targetDayOfWeek = line.day_of_week;
    let targetDayName = line.day_name;

    if (body.day_of_week !== undefined || body.day_name !== undefined || body.day !== undefined) {
      let dOfWeek = typeof body.day_of_week === "number" ? body.day_of_week : -1;
      let dName = body.day_name || body.day || "";

      if (dOfWeek < 0 || dOfWeek > 6) {
        if (dName) {
          const idx = DAY_NAMES.findIndex(
            (d) => d.toLowerCase() === String(dName).trim().toLowerCase()
          );
          if (idx >= 0) dOfWeek = idx;
        }
      }

      if (dOfWeek >= 0 && dOfWeek <= 6) {
        targetDayOfWeek = dOfWeek;
        targetDayName = dName || DAY_NAMES[dOfWeek];
      }
    }

    if (targetDayOfWeek !== line.day_of_week) {
      const conflict = await prisma.working_schedule_lines.findFirst({
        where: {
          working_schedule_id: scheduleId,
          day_of_week: targetDayOfWeek,
          id: { not: lineId },
        },
      });
      if (conflict) {
        return jsonCorsResponse(
          { success: false, error: `Another line for ${targetDayName} already exists in this schedule.` },
          { status: 409 },
          req
        );
      }
      updateData.day_of_week = targetDayOfWeek;
      updateData.day_name = targetDayName;
    }

    const isWorkingDay =
      body.is_working_day !== undefined ? Boolean(body.is_working_day) : line.is_working_day;
    updateData.is_working_day = isWorkingDay;

    let breakMins = line.break_duration_minutes;
    if (body.break_duration_minutes !== undefined || body.break !== undefined) {
      breakMins = parseInt(String(body.break_duration_minutes ?? body.break), 10);
      if (isNaN(breakMins) || breakMins < 0) {
        return jsonCorsResponse(
          { success: false, error: "Break duration cannot be negative." },
          { status: 422 },
          req
        );
      }
      updateData.break_duration_minutes = breakMins;
    }

    let startDate = line.start_time;
    if (body.start_time !== undefined) {
      startDate = parseTimeStringToDate(body.start_time);
      updateData.start_time = startDate;
    }

    let endDate = line.end_time;
    if (body.end_time !== undefined) {
      endDate = parseTimeStringToDate(body.end_time);
      updateData.end_time = endDate;
    }

    const calculatedNet = calculateNetHours(startDate, endDate, breakMins, isWorkingDay);
    if (calculatedNet < 0) {
      return jsonCorsResponse(
        { success: false, error: "Calculated net hours cannot be negative." },
        { status: 422 },
        req
      );
    }

    const updatedLine = await prisma.working_schedule_lines.update({
      where: { id: lineId },
      data: updateData,
    });

    // Recalculate schedule's total weekly hours
    const newTotalWeeklyHours = await recalculateScheduleHours(scheduleId);

    await logAuditAction(
      auth.sessionData.user.id,
      "UPDATE_LINE",
      scheduleId,
      line,
      { updatedLine, newTotalWeeklyHours }
    );

    return jsonCorsResponse(
      {
        success: true,
        data: formatLinePayload(updatedLine),
        total_weekly_hours: newTotalWeeklyHours,
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error(`PATCH /api/working-schedules/${params.id}/lines/${params.lineId} error:`, error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * DELETE /api/working-schedules/[id]/lines/[lineId]
 * Remove a schedule line from a working schedule.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const scheduleId = parseInt(params.id, 10);
    const lineId = parseInt(params.lineId, 10);

    if (isNaN(scheduleId) || scheduleId <= 0 || isNaN(lineId) || lineId <= 0) {
      return jsonCorsResponse({ success: false, error: "Invalid schedule ID or line ID" }, { status: 400 }, req);
    }

    const line = await prisma.working_schedule_lines.findUnique({
      where: { id: lineId },
    });

    if (!line || line.working_schedule_id !== scheduleId) {
      return jsonCorsResponse(
        { success: false, error: "Schedule line not found for this schedule." },
        { status: 404 },
        req
      );
    }

    await prisma.working_schedule_lines.delete({
      where: { id: lineId },
    });

    // Recalculate schedule's total weekly hours
    const newTotalWeeklyHours = await recalculateScheduleHours(scheduleId);

    await logAuditAction(
      auth.sessionData.user.id,
      "DELETE_LINE",
      scheduleId,
      line,
      { deleted_line_id: lineId, newTotalWeeklyHours }
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Schedule line deleted successfully.",
        total_weekly_hours: newTotalWeeklyHours,
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error(`DELETE /api/working-schedules/${params.id}/lines/${params.lineId} error:`, error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

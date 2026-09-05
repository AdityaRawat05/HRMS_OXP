import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  DAY_NAMES,
  parseTimeStringToDate,
  calculateNetHours,
  formatSchedulePayload,
  logAuditAction,
} from "@/lib/working-schedules";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * GET /api/working-schedules
 * Supports search, company_id, is_active/status, days_per_week filtering.
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || searchParams.get("q") || "";
    const companyIdParam = searchParams.get("company_id") || searchParams.get("company");
    const statusParam = searchParams.get("status") || searchParams.get("is_active");
    const daysPerWeekParam = searchParams.get("days_per_week");

    const where: any = {};

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { companies: { name: { contains: q } } },
      ];
    }

    if (companyIdParam) {
      const cId = parseInt(companyIdParam, 10);
      if (!isNaN(cId)) {
        where.company_id = cId;
      }
    }

    if (statusParam !== null && statusParam !== undefined && statusParam !== "") {
      const lower = statusParam.toLowerCase();
      if (lower === "active" || lower === "true" || lower === "1") {
        where.is_active = true;
      } else if (lower === "inactive" || lower === "false" || lower === "0") {
        where.is_active = false;
      }
    }

    const schedules = await prisma.working_schedules.findMany({
      where,
      include: {
        companies: true,
        working_schedule_lines: {
          orderBy: { day_of_week: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });

    let formatted = schedules.map(formatSchedulePayload);

    if (daysPerWeekParam) {
      const targetDays = parseInt(daysPerWeekParam, 10);
      if (!isNaN(targetDays)) {
        formatted = formatted.filter((s) => s.days_per_week === targetDays);
      }
    }

    return jsonCorsResponse(
      {
        success: true,
        data: formatted,
        total: formatted.length,
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("GET /api/working-schedules error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * POST /api/working-schedules
 * Create a new Working Schedule (with optional schedule lines in a transaction).
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

    const { name, company_id, timezone, is_default, is_active, lines } = body;

    // Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return jsonCorsResponse(
        { success: false, error: "Schedule name is required." },
        { status: 422 },
        req
      );
    }

    const cId = parseInt(String(company_id), 10);
    if (isNaN(cId) || cId <= 0) {
      return jsonCorsResponse(
        { success: false, error: "Valid company_id is required." },
        { status: 422 },
        req
      );
    }

    // Check company existence
    const company = await prisma.companies.findUnique({
      where: { id: cId },
    });

    if (!company) {
      return jsonCorsResponse(
        { success: false, error: `Company with ID ${cId} not found.` },
        { status: 404 },
        req
      );
    }

    // Check unique constraint: company_id + name
    const existing = await prisma.working_schedules.findFirst({
      where: {
        company_id: cId,
        name: name.trim(),
      },
    });

    if (existing) {
      return jsonCorsResponse(
        { success: false, error: `Working schedule named "${name.trim()}" already exists for this company.` },
        { status: 409 },
        req
      );
    }

    const activeState = is_active !== undefined ? Boolean(is_active) : true;
    const defaultState = is_default !== undefined ? Boolean(is_default) : false;
    const scheduleTimezone = timezone && typeof timezone === "string" ? timezone.trim() : "Asia/Kolkata";

    // Validate lines if provided
    const linesToCreate: any[] = [];
    if (lines && Array.isArray(lines)) {
      const seenDays = new Set<number>();

      for (let i = 0; i < lines.length; i++) {
        const item = lines[i];
        let dayOfWeek = typeof item.day_of_week === "number" ? item.day_of_week : -1;
        let dayName = item.day_name || item.day || "";

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
            { success: false, error: `Invalid day of week at line ${i + 1}. Must be 0-6 or valid day name.` },
            { status: 422 },
            req
          );
        }

        if (!dayName) {
          dayName = DAY_NAMES[dayOfWeek];
        }

        if (seenDays.has(dayOfWeek)) {
          return jsonCorsResponse(
            { success: false, error: `Duplicate day entry for "${dayName}" (day ${dayOfWeek}).` },
            { status: 422 },
            req
          );
        }
        seenDays.add(dayOfWeek);

        const isWorkingDay = item.is_working_day !== undefined ? Boolean(item.is_working_day) : true;
        const breakMins = parseInt(String(item.break_duration_minutes ?? item.break ?? 60), 10) || 0;

        if (breakMins < 0) {
          return jsonCorsResponse(
            { success: false, error: `Break duration cannot be negative for ${dayName}.` },
            { status: 422 },
            req
          );
        }

        const startStr = item.start_time || "09:00";
        const endStr = item.end_time || "18:00";
        const startDate = parseTimeStringToDate(startStr);
        const endDate = parseTimeStringToDate(endStr);

        const netHours = calculateNetHours(startDate, endDate, breakMins, isWorkingDay);

        linesToCreate.push({
          day_of_week: dayOfWeek,
          day_name: dayName,
          start_time: startDate,
          end_time: endDate,
          break_duration_minutes: breakMins,
          is_working_day: isWorkingDay,
          calculated_net_hours: netHours,
        });
      }
    }

    // Execute in Prisma Transaction
    const newSchedule = await prisma.$transaction(async (tx) => {
      if (defaultState) {
        // Unset other default schedules for this company
        await tx.working_schedules.updateMany({
          where: { company_id: cId, is_default: true },
          data: { is_default: false },
        });
      }

      let totalWeeklyHours = 0;
      for (const line of linesToCreate) {
        if (line.is_working_day) {
          totalWeeklyHours += line.calculated_net_hours;
        }
      }

      const schedule = await tx.working_schedules.create({
        data: {
          company_id: cId,
          name: name.trim(),
          timezone: scheduleTimezone,
          total_weekly_hours: Math.round(totalWeeklyHours * 100) / 100,
          is_default: defaultState,
          is_active: activeState,
        },
      });

      if (linesToCreate.length > 0) {
        for (const lineData of linesToCreate) {
          await tx.working_schedule_lines.create({
            data: {
              working_schedule_id: schedule.id,
              day_of_week: lineData.day_of_week,
              day_name: lineData.day_name,
              start_time: lineData.start_time,
              end_time: lineData.end_time,
              break_duration_minutes: lineData.break_duration_minutes,
              is_working_day: lineData.is_working_day,
            },
          });
        }
      }

      return schedule;
    });

    await logAuditAction(auth.sessionData.user.id, "CREATE", newSchedule.id, null, {
      name: newSchedule.name,
      company_id: newSchedule.company_id,
      total_weekly_hours: newSchedule.total_weekly_hours,
    });

    // Retrieve created schedule with relations
    const fullSchedule = await prisma.working_schedules.findUnique({
      where: { id: newSchedule.id },
      include: {
        companies: true,
        working_schedule_lines: {
          orderBy: { day_of_week: "asc" },
        },
      },
    });

    return jsonCorsResponse(
      {
        success: true,
        data: formatSchedulePayload(fullSchedule),
      },
      { status: 201 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/working-schedules error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

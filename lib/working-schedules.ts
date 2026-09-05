import { prisma } from "@/lib/prisma";

export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function parseTimeStringToDate(timeStr: string): Date {
  if (!timeStr) return new Date("1970-01-01T00:00:00.000Z");
  if (timeStr.includes("T")) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) return d;
  }
  const parts = timeStr.split(":");
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parseInt(parts[2], 10) || 0;
  const d = new Date("1970-01-01T00:00:00.000Z");
  d.setUTCHours(hours, minutes, seconds, 0);
  return d;
}

export function formatDateToTimeString(dateInput: Date | string | null): string {
  if (!dateInput) return "00:00";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "00:00";
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function calculateNetHours(
  startTime: Date,
  endTime: Date,
  breakMinutes: number,
  isWorkingDay: boolean
): number {
  if (!isWorkingDay) return 0;
  const startMs = startTime.getTime();
  const endMs = endTime.getTime();
  let diffMinutes = (endMs - startMs) / (1000 * 60);
  if (diffMinutes < 0) {
    diffMinutes += 1440; // Overnight shift handle
  }
  const netMins = diffMinutes - (breakMinutes || 0);
  const netHours = Math.max(0, netMins / 60);
  return Math.round(netHours * 100) / 100;
}

export function formatLinePayload(line: any) {
  const startTimeStr = formatDateToTimeString(line.start_time);
  const endTimeStr = formatDateToTimeString(line.end_time);
  const netHours = line.net_hours ? Number(line.net_hours) : 0;

  return {
    id: line.id,
    working_schedule_id: line.working_schedule_id,
    day_of_week: line.day_of_week,
    day: line.day_name,
    day_name: line.day_name,
    start_time: startTimeStr,
    end_time: endTimeStr,
    break_duration_minutes: line.break_duration_minutes,
    break: line.break_duration_minutes,
    break_duration: line.break_duration_minutes,
    is_working_day: Boolean(line.is_working_day),
    net_hours: netHours,
    hours: netHours,
  };
}

export function formatSchedulePayload(schedule: any) {
  const rawLines = schedule.working_schedule_lines || [];
  const lines = rawLines.map(formatLinePayload);
  const workingDaysCount = lines.filter((l: any) => l.is_working_day).length;
  const totalHours = schedule.total_weekly_hours ? Number(schedule.total_weekly_hours) : 0;
  const companyName = schedule.companies?.name || "N/A";

  return {
    id: schedule.id,
    company_id: schedule.company_id,
    company: {
      id: schedule.companies?.id || schedule.company_id,
      name: companyName,
      legal_name: schedule.companies?.legal_name || null,
    },
    company_name: companyName,
    name: schedule.name,
    schedule_name: schedule.name,
    timezone: schedule.timezone || "Asia/Kolkata",
    total_weekly_hours: totalHours,
    hours_per_week: `${totalHours}h`,
    days_per_week: workingDaysCount,
    is_default: Boolean(schedule.is_default),
    is_active: Boolean(schedule.is_active),
    status: schedule.is_active ? "Active" : "Inactive",
    active_status: schedule.is_active ? "Active" : "Inactive",
    created_at: schedule.created_at,
    updated_at: schedule.updated_at,
    lines: lines,
    working_schedule_lines: lines,
  };
}

export async function recalculateScheduleHours(scheduleId: number, tx?: any) {
  const db = tx || prisma;
  const lines = await db.working_schedule_lines.findMany({
    where: { working_schedule_id: scheduleId },
  });

  let totalHours = 0;
  for (const line of lines) {
    if (line.is_working_day && line.net_hours) {
      totalHours += Number(line.net_hours);
    }
  }

  const roundedHours = Math.round(totalHours * 100) / 100;

  await db.working_schedules.update({
    where: { id: scheduleId },
    data: {
      total_weekly_hours: roundedHours,
      updated_at: new Date(),
    },
  });

  return roundedHours;
}

export async function logAuditAction(
  userId: number | undefined,
  action: string,
  entityId: number,
  oldValue?: any,
  newValue?: any
) {
  try {
    await prisma.audit_logs.create({
      data: {
        user_id: userId || null,
        action: action.substring(0, 30),
        entity_type: "working_schedules",
        entity_id: BigInt(entityId),
        old_value: oldValue ? JSON.stringify(oldValue) : null,
        new_value: newValue ? JSON.stringify(newValue) : null,
      },
    });
  } catch (err) {
    console.error("Audit log record error:", err);
  }
}

import { prisma } from "@/lib/prisma";

export function formatAttendanceStatusDisplay(status: string): string {
  switch (status) {
    case "present":
      return "Present";
    case "absent":
      return "Absent";
    case "late":
      return "Late";
    case "half_day":
      return "Half Day";
    case "on_leave":
      return "On Leave";
    case "holiday":
      return "Holiday";
    case "missing_checkout":
      return "Missing Checkout";
    default:
      return status;
  }
}

export function formatTimeHHMM(dateInput: Date | string | null): string {
  if (!dateInput) return "—";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatDurationHuman(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0h 00m";
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function calculateWorkedAndOvertime(
  checkIn: Date,
  checkOut: Date,
  breakHours: number = 0,
  scheduledDailyHours: number = 8.0
): { workedHours: number; overtimeHours: number } {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const diffMins = diffMs / (1000 * 60);
  const breakMins = breakHours * 60;
  const netMins = Math.max(0, diffMins - breakMins);
  const workedHours = Math.round((netMins / 60) * 100) / 100;
  const overtimeHours = workedHours > scheduledDailyHours
    ? Math.round((workedHours - scheduledDailyHours) * 100) / 100
    : 0;

  return { workedHours, overtimeHours };
}

export function formatAttendancePayload(record: any) {
  const emp = record.employees;
  const dept = emp?.departments_employees_department_idTodepartments;
  const mgr = emp?.employees;

  const empName = emp
    ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
    : "Unknown Employee";

  const mgrName = mgr
    ? `${mgr.first_name || ""} ${mgr.last_name || ""}`.trim()
    : "N/A";

  const workedH = record.worked_hours !== null && record.worked_hours !== undefined
    ? Number(record.worked_hours)
    : null;

  const overtimeH = record.overtime_hours !== null && record.overtime_hours !== undefined
    ? Number(record.overtime_hours)
    : 0;

  const breakH = record.break_hours !== null && record.break_hours !== undefined
    ? Number(record.break_hours)
    : 0;

  const checkInDate = record.check_in ? new Date(record.check_in) : null;
  const checkOutDate = record.check_out ? new Date(record.check_out) : null;

  let runningWorkedHours = 0;
  let runningDisplay = "0h 00m";

  if (checkInDate && !checkOutDate) {
    const elapsedMins = (Date.now() - checkInDate.getTime()) / (1000 * 60);
    const netMins = Math.max(0, elapsedMins - (breakH * 60));
    runningWorkedHours = Math.round((netMins / 60) * 100) / 100;
    runningDisplay = formatDurationHuman(netMins);
  } else if (workedH !== null) {
    runningWorkedHours = workedH;
    runningDisplay = formatDurationHuman(workedH * 60);
  }

  const dateStr = record.attendance_date
    ? new Date(record.attendance_date).toISOString().split("T")[0]
    : "";

  return {
    id: record.id.toString(),
    employee_id: record.employee_id,
    employee: {
      id: emp?.id || record.employee_id,
      name: empName,
      first_name: emp?.first_name || "",
      last_name: emp?.last_name || "",
      employee_code: emp?.employee_code || "",
      work_email: emp?.work_email || "",
      avatar_url: emp?.avatar_url || null,
    },
    employee_name: empName,
    department: dept?.name || "Unassigned",
    department_detail: dept ? { id: dept.id, name: dept.name } : null,
    manager: mgrName,
    manager_detail: mgr ? { id: mgr.id, name: mgrName } : null,
    attendance_date: dateStr,
    check_in: checkInDate ? checkInDate.toISOString() : null,
    check_in_time: formatTimeHHMM(checkInDate),
    check_out: checkOutDate ? checkOutDate.toISOString() : null,
    check_out_time: formatTimeHHMM(checkOutDate),
    worked_hours: workedH,
    running_worked_hours: runningWorkedHours,
    running_worked_hours_display: runningDisplay,
    overtime_hours: overtimeH,
    break_hours: breakH,
    status: record.status,
    status_display: formatAttendanceStatusDisplay(record.status),
    is_late: Boolean(record.is_late),
    late_minutes: record.late_minutes || 0,
    is_early_leave: Boolean(record.is_early_leave),
    is_manually_corrected: Boolean(record.is_manually_corrected),
    corrected_by: record.corrected_by || null,
    correction_reason: record.correction_reason || null,
    notes: record.correction_reason || null,
    source: record.source || "web",
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

export async function logAttendanceAudit(
  userId: number | undefined,
  action: string,
  recordId: bigint | number,
  oldValue?: any,
  newValue?: any
) {
  try {
    await prisma.audit_logs.create({
      data: {
        user_id: userId || null,
        action: action.substring(0, 30),
        entity_type: "attendance_records",
        entity_id: BigInt(recordId),
        old_value: oldValue ? JSON.stringify(oldValue) : null,
        new_value: newValue ? JSON.stringify(newValue) : null,
      },
    });
  } catch (err) {
    console.error("Attendance audit log error:", err);
  }
}

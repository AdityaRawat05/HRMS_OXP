"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  WorkingScheduleRecord,
  WorkingScheduleLine,
  createWorkingScheduleApi,
  updateWorkingScheduleApi,
  deleteWorkingScheduleApi,
  addScheduleLineApi,
  updateScheduleLineApi,
  deleteScheduleLineApi,
} from "../../lib/api";

interface WorkingScheduleFormProps {
  schedule?: WorkingScheduleRecord | null;
  onBack: () => void;
  onSaved: () => void;
}

const DEFAULT_DAYS = [
  { day_of_week: 0, day_name: "Monday", is_working_day: true, start_time: "09:00", end_time: "18:00", break_duration_minutes: 60 },
  { day_of_week: 1, day_name: "Tuesday", is_working_day: true, start_time: "09:00", end_time: "18:00", break_duration_minutes: 60 },
  { day_of_week: 2, day_name: "Wednesday", is_working_day: true, start_time: "09:00", end_time: "18:00", break_duration_minutes: 60 },
  { day_of_week: 3, day_name: "Thursday", is_working_day: true, start_time: "09:00", end_time: "18:00", break_duration_minutes: 60 },
  { day_of_week: 4, day_name: "Friday", is_working_day: true, start_time: "09:00", end_time: "18:00", break_duration_minutes: 60 },
  { day_of_week: 5, day_name: "Saturday", is_working_day: false, start_time: "09:00", end_time: "13:00", break_duration_minutes: 0 },
  { day_of_week: 6, day_name: "Sunday", is_working_day: false, start_time: "09:00", end_time: "13:00", break_duration_minutes: 0 },
];

function calcLineHours(startTime: string, endTime: string, breakMins: number, isWorkingDay: boolean): number {
  if (!isWorkingDay) return 0;
  const parseMins = (tStr: string) => {
    const parts = (tStr || "00:00").split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };
  let start = parseMins(startTime);
  let end = parseMins(endTime);
  let diff = end - start;
  if (diff < 0) diff += 1440;
  const net = diff - (breakMins || 0);
  const hours = Math.max(0, net / 60);
  return Math.round(hours * 100) / 100;
}

export default function WorkingScheduleForm({
  schedule,
  onBack,
  onSaved,
}: WorkingScheduleFormProps) {
  const isEditing = Boolean(schedule?.id);

  const [name, setName] = useState(schedule?.name || "");
  const [companyId, setCompanyId] = useState<number>(schedule?.company_id || 2);
  const [timezone, setTimezone] = useState(schedule?.timezone || "Asia/Kolkata");
  const [isActive, setIsActive] = useState<boolean>(schedule?.is_active ?? true);
  const [isDefault, setIsDefault] = useState<boolean>(schedule?.is_default ?? false);

  // Line state setup
  const [lines, setLines] = useState<WorkingScheduleLine[]>(() => {
    if (schedule?.lines && schedule.lines.length > 0) {
      return schedule.lines.map((l) => ({
        id: l.id,
        working_schedule_id: l.working_schedule_id,
        day_of_week: l.day_of_week,
        day_name: l.day_name || l.day || "",
        start_time: l.start_time || "09:00",
        end_time: l.end_time || "18:00",
        break_duration_minutes: l.break_duration_minutes ?? l.break ?? 60,
        is_working_day: l.is_working_day ?? true,
        net_hours: l.net_hours ?? l.hours ?? 0,
      }));
    }
    return DEFAULT_DAYS.map((d) => ({
      ...d,
      net_hours: calcLineHours(d.start_time, d.end_time, d.break_duration_minutes, d.is_working_day),
    }));
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Compute live total weekly hours
  const totalWeeklyHours = useMemo(() => {
    let sum = 0;
    for (const l of lines) {
      if (l.is_working_day) {
        sum += calcLineHours(l.start_time, l.end_time, l.break_duration_minutes, l.is_working_day);
      }
    }
    return Math.round(sum * 100) / 100;
  }, [lines]);

  const handleLineChange = (index: number, field: keyof WorkingScheduleLine, val: any) => {
    setLines((prev) => {
      const updated = [...prev];
      const line = { ...updated[index], [field]: val };
      line.net_hours = calcLineHours(
        line.start_time,
        line.end_time,
        line.break_duration_minutes,
        line.is_working_day
      );
      updated[index] = line;
      return updated;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Schedule name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isEditing && schedule?.id) {
        // 1. Update header
        const res = await updateWorkingScheduleApi(schedule.id, {
          name: name.trim(),
          company_id: companyId,
          timezone: timezone.trim(),
          is_active: isActive,
          is_default: isDefault,
        });

        if (!res.success) {
          setError(res.error || "Failed to update schedule header.");
          setSaving(false);
          return;
        }

        // 2. Update/create lines
        for (const l of lines) {
          if (l.id) {
            await updateScheduleLineApi(schedule.id, l.id, {
              day_of_week: l.day_of_week,
              day_name: l.day_name,
              start_time: l.start_time,
              end_time: l.end_time,
              break_duration_minutes: l.break_duration_minutes,
              is_working_day: l.is_working_day,
            });
          } else {
            await addScheduleLineApi(schedule.id, {
              day_of_week: l.day_of_week,
              day_name: l.day_name,
              start_time: l.start_time,
              end_time: l.end_time,
              break_duration_minutes: l.break_duration_minutes,
              is_working_day: l.is_working_day,
            });
          }
        }

        setSuccessMsg("Working schedule updated successfully.");
        setTimeout(() => onSaved(), 800);
      } else {
        // Create new schedule with lines in transaction
        const payloadLines = lines.map((l) => ({
          day_of_week: l.day_of_week,
          day_name: l.day_name,
          start_time: l.start_time,
          end_time: l.end_time,
          break_duration_minutes: l.break_duration_minutes,
          is_working_day: l.is_working_day,
        }));

        const res = await createWorkingScheduleApi({
          name: name.trim(),
          company_id: companyId,
          timezone: timezone.trim(),
          is_active: isActive,
          is_default: isDefault,
          lines: payloadLines,
        });

        if (res.success) {
          setSuccessMsg("Working schedule created successfully.");
          setTimeout(() => onSaved(), 800);
        } else {
          setError(res.error || "Failed to create working schedule.");
        }
      }
    } catch (err: any) {
      console.error("Save schedule error:", err);
      setError("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule?.id) return;
    if (!confirm(`Are you sure you want to delete or deactivate "${schedule.name}"?`)) return;

    setDeleting(true);
    setError(null);

    try {
      const res = await deleteWorkingScheduleApi(schedule.id);
      if (res.success) {
        alert(res.data?.message || "Schedule processed successfully.");
        onSaved();
      } else {
        setError(res.error || "Failed to delete schedule.");
      }
    } catch (err: any) {
      console.error("Delete schedule error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto">
      {/* Header with Back button */}
      <div className="flex items-center justify-between pb-4 border-b border-[#263449]/60 mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-[8px] bg-[#111827] border border-[#263449] text-[#A7B3C6] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-[20px] font-bold text-[#F8FAFC]">
              {isEditing && schedule ? `Edit Working Schedule: ${schedule.name}` : "Create New Working Schedule"}
            </h1>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">
              Set shift times, breaks, and calculate total weekly working hours.
            </p>
          </div>
        </div>

        {/* Live Total Weekly Hours Pill */}
        <div className="bg-[#111827] border border-[#4F8CFF]/30 px-3.5 py-1.5 rounded-[8px] text-right">
          <span className="text-[11px] text-[#64748B] uppercase font-semibold block">Total Hours</span>
          <span className="text-[17px] font-extrabold text-[#4F8CFF]">{totalWeeklyHours} Hours/Week</span>
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[10px] text-[#EF4444] text-[13px] flex items-center space-x-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-[10px] text-[#22C55E] text-[13px] flex items-center space-x-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Schedule Header Information Form Box */}
        <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-6 space-y-4">
          <h2 className="text-[14px] font-bold text-[#F8FAFC] tracking-wide border-b border-[#263449] pb-3 mb-4">
            General Schedule Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Schedule Name */}
            <div>
              <label className="block text-[12.5px] font-medium text-[#A7B3C6] mb-1.5">
                Schedule Name <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Standard 40h Week, Night Shift"
                className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3.5 py-2 outline-none"
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-[12.5px] font-medium text-[#A7B3C6] mb-1.5">
                Timezone
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Kolkata, UTC"
                className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3.5 py-2 outline-none"
              />
            </div>
          </div>

          {/* Options Toggles */}
          <div className="pt-3 flex flex-wrap items-center gap-6 text-[13px] text-[#F8FAFC]">
            <label className="inline-flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-[#4F8CFF] rounded"
              />
              <span className="font-medium">Active Status</span>
            </label>

            <label className="inline-flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 accent-[#4F8CFF] rounded"
              />
              <span className="font-medium">Set as Default Company Schedule</span>
            </label>
          </div>
        </div>

        {/* Daily Schedule Lines Table */}
        <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-6">
          <div className="flex items-center justify-between border-b border-[#263449] pb-3 mb-4">
            <div>
              <h2 className="text-[14px] font-bold text-[#F8FAFC] tracking-wide">
                Daily Shift Lines
              </h2>
              <p className="text-[11.5px] text-[#94A3B8] mt-0.5">
                Configure start time, end time, and break duration for each day of the week.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#263449] text-[#64748B] text-[11.5px] font-semibold uppercase">
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3 text-center">Working Day</th>
                  <th className="py-2.5 px-3">Start Time</th>
                  <th className="py-2.5 px-3">End Time</th>
                  <th className="py-2.5 px-3">Break (Mins)</th>
                  <th className="py-2.5 px-3 text-right">Net Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {lines.map((line, idx) => {
                  const netH = calcLineHours(
                    line.start_time,
                    line.end_time,
                    line.break_duration_minutes,
                    line.is_working_day
                  );

                  return (
                    <tr key={idx} className={`hover:bg-[#172033]/40 ${!line.is_working_day ? "opacity-60" : ""}`}>
                      {/* Day Name */}
                      <td className="py-3 px-3 font-semibold text-[#F8FAFC]">
                        {line.day_name || line.day}
                      </td>

                      {/* Working Day Toggle */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={line.is_working_day}
                          onChange={(e) => handleLineChange(idx, "is_working_day", e.target.checked)}
                          className="w-4 h-4 accent-[#4F8CFF] rounded cursor-pointer"
                        />
                      </td>

                      {/* Start Time */}
                      <td className="py-3 px-3">
                        <input
                          type="time"
                          disabled={!line.is_working_day}
                          value={line.start_time}
                          onChange={(e) => handleLineChange(idx, "start_time", e.target.value)}
                          className="bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[12.5px] rounded-[6px] px-2.5 py-1 outline-none disabled:opacity-50"
                        />
                      </td>

                      {/* End Time */}
                      <td className="py-3 px-3">
                        <input
                          type="time"
                          disabled={!line.is_working_day}
                          value={line.end_time}
                          onChange={(e) => handleLineChange(idx, "end_time", e.target.value)}
                          className="bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[12.5px] rounded-[6px] px-2.5 py-1 outline-none disabled:opacity-50"
                        />
                      </td>

                      {/* Break Mins */}
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          min="0"
                          step="5"
                          disabled={!line.is_working_day}
                          value={line.break_duration_minutes}
                          onChange={(e) =>
                            handleLineChange(idx, "break_duration_minutes", parseInt(e.target.value, 10) || 0)
                          }
                          className="w-20 bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[12.5px] rounded-[6px] px-2.5 py-1 outline-none disabled:opacity-50"
                        />
                      </td>

                      {/* Net Hours */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#4F8CFF]">
                        {line.is_working_day ? `${netH}h` : "0h"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Form Actions */}
        <div className="flex items-center justify-between pt-2">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/30 text-[#EF4444] text-[13px] font-semibold rounded-[8px] transition-colors"
            >
              {deleting ? "Deleting..." : "Delete / Deactivate"}
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 bg-[#172033] border border-[#263449] hover:bg-[#1E293B] text-[#A7B3C6] hover:text-[#F8FAFC] text-[13px] font-medium rounded-[8px] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#4F8CFF] hover:bg-[#3B82F6] text-white font-semibold text-[13px] rounded-[8px] transition-all shadow-sm active:scale-[0.98] flex items-center space-x-2"
            >
              {saving && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{isEditing ? "Save Changes" : "Create Working Schedule"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

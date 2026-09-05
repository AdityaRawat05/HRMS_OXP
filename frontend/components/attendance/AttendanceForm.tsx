"use client";

import React, { useState, useEffect } from "react";
import {
  getEmployeesApi,
  createAttendanceApi,
  updateAttendanceApi,
  EmployeeOption,
  AttendanceRecord,
} from "../../lib/api";

interface AttendanceFormProps {
  record?: AttendanceRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function AttendanceForm({
  record,
  onClose,
  onSaved,
}: AttendanceFormProps) {
  const isEditing = Boolean(record?.id);

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [employeeId, setEmployeeId] = useState<number | string>(record?.employee_id || "");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    record?.attendance_date || new Date().toISOString().split("T")[0]
  );
  const [checkIn, setCheckIn] = useState<string>(
    record?.check_in ? new Date(record.check_in).toISOString().slice(0, 16) : ""
  );
  const [checkOut, setCheckOut] = useState<string>(
    record?.check_out ? new Date(record.check_out).toISOString().slice(0, 16) : ""
  );
  const [status, setStatus] = useState<string>(record?.status || "present");
  const [workedHours, setWorkedHours] = useState<string>(
    record?.worked_hours !== null && record?.worked_hours !== undefined ? String(record.worked_hours) : ""
  );
  const [overtimeHours, setOvertimeHours] = useState<string>(
    record?.overtime_hours !== undefined ? String(record.overtime_hours) : "0.00"
  );
  const [breakHours, setBreakHours] = useState<string>(
    record?.break_hours !== undefined ? String(record.break_hours) : "0.00"
  );
  const [notes, setNotes] = useState<string>(record?.correction_reason || record?.notes || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await getEmployeesApi();
        if (res.success && res.data?.employees) {
          setEmployees(res.data.employees);
          if (!employeeId && res.data.employees.length > 0) {
            setEmployeeId(res.data.employees[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load employee options:", err);
      }
    }
    loadEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }
    if (!checkIn) {
      setError("Check-in timestamp is required.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      employee_id: Number(employeeId),
      attendance_date: attendanceDate,
      check_in: checkIn ? new Date(checkIn).toISOString() : null,
      check_out: checkOut ? new Date(checkOut).toISOString() : null,
      status,
      worked_hours: workedHours !== "" ? parseFloat(workedHours) : null,
      overtime_hours: parseFloat(overtimeHours) || 0,
      break_hours: parseFloat(breakHours) || 0,
      notes: notes.trim() || null,
      correction_reason: notes.trim() || null,
    };

    try {
      if (isEditing && record?.id) {
        const res = await updateAttendanceApi(record.id, payload);
        if (res.success) {
          onSaved();
        } else {
          setError(res.error || "Failed to update attendance record.");
        }
      } else {
        const res = await createAttendanceApi(payload);
        if (res.success) {
          onSaved();
        } else {
          setError(res.error || "Failed to create attendance record.");
        }
      }
    } catch (err: any) {
      console.error("Form submit error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#111827] border border-[#263449] rounded-[14px] w-full max-w-[600px] p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#263449] mb-4">
          <h2 className="text-[17px] font-bold text-[#F8FAFC]">
            {isEditing ? "Manual Attendance Correction" : "New Attendance Record"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#F8FAFC] p-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[8px] text-[#EF4444] text-[12.5px] flex items-center space-x-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
          {/* Employee */}
          <div>
            <label className="block text-[#A7B3C6] font-medium mb-1">
              Employee <span className="text-[#EF4444]">*</span>
            </label>
            <select
              disabled={isEditing}
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] rounded-[8px] px-3 py-2 outline-none disabled:opacity-60"
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id} className="bg-[#111827]">
                  {e.first_name} {e.last_name} ({e.employee_code})
                </option>
              ))}
            </select>
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A7B3C6] font-medium mb-1">
                Attendance Date <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="date"
                required
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] rounded-[8px] px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#A7B3C6] font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] rounded-[8px] px-3 py-2 outline-none"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Check In & Check Out */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A7B3C6] font-medium mb-1">
                Check In Time <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] rounded-[8px] px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#A7B3C6] font-medium mb-1">Check Out Time</label>
              <input
                type="datetime-local"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] rounded-[8px] px-3 py-2 outline-none"
              />
            </div>
          </div>

          {/* Hours Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#A7B3C6] font-medium mb-1">Worked Hours</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={workedHours}
                onChange={(e) => setWorkedHours(e.target.value)}
                placeholder="Auto-calc"
                className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] rounded-[8px] px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#A7B3C6] font-medium mb-1">Overtime (Hrs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] rounded-[8px] px-3 py-2 outline-none"
              />
            </div>

            <div>
              <label className="block text-[#A7B3C6] font-medium mb-1">Break (Hrs)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={breakHours}
                onChange={(e) => setBreakHours(e.target.value)}
                className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] rounded-[8px] px-3 py-2 outline-none"
              />
            </div>
          </div>

          {/* Notes / Reason */}
          <div>
            <label className="block text-[#A7B3C6] font-medium mb-1">Correction Reason / Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="System-generated check in/out or manual correction reason..."
              className="w-full bg-[#0B1220] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] rounded-[8px] px-3 py-2 outline-none resize-none"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#263449]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#172033] border border-[#263449] hover:bg-[#1E293B] text-[#A7B3C6] font-medium rounded-[8px] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#4F8CFF] hover:bg-[#3B82F6] text-white font-semibold rounded-[8px] transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{isEditing ? "Save Changes" : "Create Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

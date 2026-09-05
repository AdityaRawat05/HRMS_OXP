"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getAttendanceMeApi,
  checkInApi,
  checkOutApi,
  AttendanceWidgetData,
} from "../../lib/api";

interface AttendanceWidgetProps {
  onStatusChange?: () => void;
}

export default function AttendanceWidget({ onStatusChange }: AttendanceWidgetProps) {
  const [widgetData, setWidgetData] = useState<AttendanceWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchWidgetState = useCallback(async () => {
    setErrorMsg(null);
    try {
      const res = await getAttendanceMeApi();
      if (res.success && res.data) {
        setWidgetData(res.data);
      } else {
        setErrorMsg(res.error || "Unable to load attendance status.");
      }
    } catch (err: any) {
      console.error("Widget fetch error:", err);
      setErrorMsg("Failed to load attendance widget.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWidgetState();
  }, [fetchWidgetState]);

  // Live timer interval to update local running duration display every 60s
  useEffect(() => {
    if (!widgetData?.is_checked_in || !widgetData?.check_in) return;

    const interval = setInterval(() => {
      const checkInMs = new Date(widgetData.check_in!).getTime();
      const elapsedMins = Math.max(0, Math.floor((Date.now() - checkInMs) / (1000 * 60)));
      const h = Math.floor(elapsedMins / 60);
      const m = elapsedMins % 60;
      const displayStr = `${h}h${m.toString().padStart(2, "0")}`;

      setWidgetData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          running_worked_hours_display: displayStr,
          running_worked_hours: Math.round((elapsedMins / 60) * 100) / 100,
        };
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [widgetData?.is_checked_in, widgetData?.check_in]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await checkInApi();
      if (res.success) {
        setSuccessMsg("Checked in successfully!");
        await fetchWidgetState();
        if (onStatusChange) onStatusChange();
      } else {
        setErrorMsg(res.error || "Failed to check in.");
      }
    } catch (err: any) {
      console.error("Check in error:", err);
      setErrorMsg("Check-in request failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await checkOutApi();
      if (res.success) {
        setSuccessMsg("Checked out successfully!");
        await fetchWidgetState();
        if (onStatusChange) onStatusChange();
      } else {
        setErrorMsg(res.error || "Failed to check out.");
      }
    } catch (err: any) {
      console.error("Check out error:", err);
      setErrorMsg("Check-out request failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 w-full max-w-[380px] animate-pulse space-y-4">
        <div className="h-4 bg-[#1E293B] rounded w-1/3"></div>
        <div className="h-6 bg-[#1E293B] rounded w-2/3"></div>
        <div className="h-10 bg-[#1E293B] rounded w-full"></div>
      </div>
    );
  }

  const empName = widgetData?.authenticated_employee?.name || "Employee";
  const isCheckedIn = Boolean(widgetData?.is_checked_in);
  const checkInTime = widgetData?.check_in_time || "—";
  const checkOutTime = widgetData?.check_out_time || "Now";
  const runningDisplay = widgetData?.running_worked_hours_display || "0h 00m";

  return (
    <div className="bg-[#111827] border border-[#263449] rounded-[14px] p-5 w-full max-w-[380px] shadow-sm flex flex-col justify-between space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-[#263449]/60 pb-3">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-[#4F8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[13px] font-bold text-[#F8FAFC] tracking-wide uppercase">
            Attendance Widget
          </span>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-[6px] bg-[#172033] border border-[#263449]">
          <span
            className={`w-2 h-2 rounded-full ${
              isCheckedIn ? "bg-[#22C55E] animate-pulse" : errorMsg ? "bg-[#EF4444]" : "bg-[#64748B]"
            }`}
          ></span>
          <span className="text-[11.5px] font-medium text-[#A7B3C6]">
            {isCheckedIn ? "Checked In" : "Checked Out"}
          </span>
        </div>
      </div>

      {/* Greeting & Employee Name */}
      <div>
        <span className="text-[12px] text-[#94A3B8] font-medium block">Welcome back</span>
        <h3 className="text-[17px] font-bold text-[#F8FAFC] truncate mt-0.5">{empName}</h3>
      </div>

      {/* Error & Success Messages */}
      {errorMsg && (
        <div className="p-2.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[8px] text-[#EF4444] text-[12px] flex items-center space-x-1.5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="truncate">{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-2.5 bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-[8px] text-[#22C55E] text-[12px] flex items-center space-x-1.5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="truncate">{successMsg}</span>
        </div>
      )}

      {/* Time Range & Live Worked Duration Box */}
      <div className="bg-[#0B1220] border border-[#1E293B] rounded-[10px] p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-[#64748B] uppercase font-semibold block">Time</span>
          <span className="text-[13px] font-medium text-[#A7B3C6] mt-0.5 block">
            {checkInTime} — {isCheckedIn ? "Now" : checkOutTime}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-[#64748B] uppercase font-semibold block">Worked</span>
          <span className="text-[18px] font-extrabold text-[#4F8CFF] font-mono mt-0.5 block">
            {runningDisplay}
          </span>
        </div>
      </div>

      {/* Today Total */}
      <div className="flex items-center justify-between text-[12px] text-[#94A3B8] px-1">
        <span>Today</span>
        <span className="font-semibold text-[#F8FAFC] font-mono">{runningDisplay}</span>
      </div>

      {/* Check In / Check Out Action Button */}
      {isCheckedIn ? (
        <button
          onClick={handleCheckOut}
          disabled={actionLoading}
          className="w-full py-2.5 bg-[#4F8CFF] hover:bg-[#3B82F6] text-white font-semibold text-[13.5px] rounded-[8px] transition-all shadow-sm active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {actionLoading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          <span>Check Out</span>
        </button>
      ) : (
        <button
          onClick={handleCheckIn}
          disabled={actionLoading}
          className="w-full py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white font-semibold text-[13.5px] rounded-[8px] transition-all shadow-sm active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {actionLoading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          <span>Check In</span>
        </button>
      )}
    </div>
  );
}

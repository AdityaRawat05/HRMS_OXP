"use client";

import React from "react";
import { PayrollDashboardData } from "../../../lib/api";

interface AttendanceOverviewProps {
  attendance: PayrollDashboardData["attendanceOverview"];
}

export default function AttendanceOverview({ attendance }: AttendanceOverviewProps) {
  const {
    presentCount,
    lateCount,
    absentCount,
    overtimeCount,
    missingCheckouts,
    attendancePercentage,
  } = attendance;

  return (
    <div className="bg-[#111827] border border-[#263449] p-5 rounded-[12px] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between pb-3 border-b border-[#263449]/60 mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#F8FAFC]">
              Attendance Overview
            </h3>
            <p className="text-[11.5px] text-[#A7B3C6] font-medium mt-0.5">
              Source: Attendance Records
            </p>
          </div>
          <span className="text-[12px] font-bold text-[#22C55E] bg-[#22C55E]/15 border border-[#22C55E]/30 px-2.5 py-0.5 rounded-[6px]">
            {attendancePercentage}% Health
          </span>
        </div>

        {/* 4-Stat Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#172033] border border-[#263449] p-3 rounded-[8px]">
            <span className="text-[11px] font-medium text-[#A7B3C6] block">Present</span>
            <span className="text-[18px] font-bold text-[#22C55E]">{presentCount}</span>
            <span className="text-[10.5px] text-[#A7B3C6] block mt-0.5">Records Logged</span>
          </div>

          <div className="bg-[#172033] border border-[#263449] p-3 rounded-[8px]">
            <span className="text-[11px] font-medium text-[#A7B3C6] block">Late Entries</span>
            <span className="text-[18px] font-bold text-[#F59E0B]">{lateCount}</span>
            <span className="text-[10.5px] text-[#A7B3C6] block mt-0.5">Tardy records</span>
          </div>

          <div className="bg-[#172033] border border-[#263449] p-3 rounded-[8px]">
            <span className="text-[11px] font-medium text-[#A7B3C6] block">Absent</span>
            <span className="text-[18px] font-bold text-[#EF4444]">{absentCount}</span>
            <span className="text-[10.5px] text-[#A7B3C6] block mt-0.5">Unexcused</span>
          </div>

          <div className="bg-[#172033] border border-[#263449] p-3 rounded-[8px]">
            <span className="text-[11px] font-medium text-[#A7B3C6] block">Overtime</span>
            <span className="text-[18px] font-bold text-[#4F8CFF]">{overtimeCount} hrs</span>
            <span className="text-[10.5px] text-[#A7B3C6] block mt-0.5">Extra worked</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-[#263449]/40 flex items-center justify-between text-[11.5px] text-[#A7B3C6]">
        <span>Missing Check-outs: <strong className="text-[#F59E0B]">{missingCheckouts}</strong></span>
        <span>Quality Index: <strong className="text-[#22C55E]">{attendancePercentage}%</strong></span>
      </div>
    </div>
  );
}

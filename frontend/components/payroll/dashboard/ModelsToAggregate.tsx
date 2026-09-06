"use client";

import React from "react";

export default function ModelsToAggregate() {
  return (
    <div className="bg-[#111827] border border-[#263449] p-4.5 rounded-[12px] shadow-sm">
      <h4 className="text-[13px] font-bold text-[#A7B3C6] uppercase tracking-wider mb-2 flex items-center space-x-1.5">
        <svg className="w-4 h-4 text-[#4F8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Models to Aggregate</span>
      </h4>
      <p className="text-[12px] text-[#A7B3C6] leading-relaxed mb-2.5">
        This is the actual challenge behind the dashboard — unified cross-module intelligence:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-[11.5px] text-[#F8FAFC]">
        <div className="bg-[#172033]/80 border border-[#263449] p-2.5 rounded-[6px]">
          <span className="font-semibold text-[#4F8CFF] block">Employees / Departments</span>
          <span className="text-[#A7B3C6] text-[10.5px]">Headcount, ownership, grouping</span>
        </div>

        <div className="bg-[#172033]/80 border border-[#263449] p-2.5 rounded-[6px]">
          <span className="font-semibold text-[#8B5CF6] block">Contracts</span>
          <span className="text-[#A7B3C6] text-[10.5px]">Wage, schedule, active status</span>
        </div>

        <div className="bg-[#172033]/80 border border-[#263449] p-2.5 rounded-[6px]">
          <span className="font-semibold text-[#22C55E] block">Payruns / Payslips</span>
          <span className="text-[#A7B3C6] text-[10.5px]">Salary totals, paid vs pending, trend</span>
        </div>

        <div className="bg-[#172033]/80 border border-[#263449] p-2.5 rounded-[6px]">
          <span className="font-semibold text-[#2DD4BF] block">Attendance</span>
          <span className="text-[#A7B3C6] text-[10.5px]">Presence, absences, late entries, OT</span>
        </div>

        <div className="bg-[#172033]/80 border border-[#263449] p-2.5 rounded-[6px]">
          <span className="font-semibold text-[#F59E0B] block">Time Off Requests / Allocations</span>
          <span className="text-[#A7B3C6] text-[10.5px]">Leave taken and remaining balance</span>
        </div>
      </div>
    </div>
  );
}

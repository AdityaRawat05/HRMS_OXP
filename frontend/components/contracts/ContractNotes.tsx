"use client";

import React from "react";

interface ContractNotesProps {
  salaryStructureName?: string | null;
  notes?: string | null;
}

export default function ContractNotes({
  salaryStructureName,
  notes,
}: ContractNotesProps) {
  return (
    <div className="w-full mt-6 bg-[#111827] border border-[#263449] rounded-[12px] p-5 shadow-sm">
      <h3 className="text-[14px] font-bold text-[#F8FAFC] mb-3 flex items-center space-x-2">
        <svg
          className="w-4 h-4 text-[#4F8CFF]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>Salary Structure / Notes</span>
      </h3>

      <div className="space-y-3 text-[13px]">
        {/* Structure Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#172033] border border-[#263449] px-4 py-2.5 rounded-[8px]">
          <span className="text-[#A7B3C6] font-medium">Structure Type:</span>
          <span className="text-[#F8FAFC] font-semibold mt-1 sm:mt-0">
            {salaryStructureName || "Standard Employee Salary Structure"}
          </span>
        </div>

        {/* Custom Notes if present */}
        {notes && (
          <div className="bg-[#0F172A] border border-[#263449] p-3.5 rounded-[8px] text-[#A7B3C6]">
            <span className="font-semibold text-[#F8FAFC] block mb-1">Contract Notes:</span>
            <p className="whitespace-pre-wrap">{notes}</p>
          </div>
        )}

        {/* Informative Guidance & Business Rule Note */}
        <div className="bg-[#4F8CFF]/10 border border-[#4F8CFF]/30 p-3.5 rounded-[8px] flex items-start space-x-2.5">
          <svg
            className="w-4 h-4 text-[#4F8CFF] shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-[12px] text-[#A7B3C6] leading-relaxed">
            <span className="font-semibold text-[#F8FAFC] block mb-0.5">
              Payroll Engine Business Rule:
            </span>
            For the problem statement, one employee should not have multiple Running contracts for the same period. The active running contract serves as the source for salary calculation in payroll runs.
          </div>
        </div>
      </div>
    </div>
  );
}

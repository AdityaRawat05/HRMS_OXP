"use client";

import React from "react";
import Link from "next/link";
import { PayrollPeriodRecord } from "../../lib/api";

interface PayslipToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedPeriodId: number | null;
  onPeriodChange: (id: number | null) => void;
  selectedState: string;
  onStateChange: (state: string) => void;
  periods: PayrollPeriodRecord[];
}

export default function PayslipToolbar({
  search,
  onSearchChange,
  selectedPeriodId,
  onPeriodChange,
  selectedState,
  onStateChange,
  periods,
}: PayslipToolbarProps) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-[22px] md:text-[24px] font-bold text-[#F8FAFC] tracking-tight">
          Payslips
        </h1>
        <p className="text-[12.5px] text-[#A7B3C6] mt-0.5">
          List view of employee payslips
        </p>
      </div>

      {/* Action Controls & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search payslips..."
            className="w-48 sm:w-56 h-9 pl-9 pr-3 text-[12.5px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF] transition-colors"
          />
          <div className="absolute left-3 top-2.5 pointer-events-none text-[#64748B]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Period Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedPeriodId || ""}
            onChange={(e) => onPeriodChange(e.target.value ? Number(e.target.value) : null)}
            className="h-9 px-3 pr-8 text-[12.5px] font-medium text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] focus:outline-none focus:border-[#4F8CFF] cursor-pointer appearance-none"
          >
            <option value="">All Periods</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-2.5 pointer-events-none text-[#64748B]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            className="h-9 px-3 pr-8 text-[12.5px] font-medium text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] focus:outline-none focus:border-[#4F8CFF] cursor-pointer appearance-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="computed">Computed</option>
            <option value="validated">Validated</option>
            <option value="paid">Paid</option>
            <option value="sent">Sent</option>
          </select>
          <div className="absolute right-2.5 top-2.5 pointer-events-none text-[#64748B]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* New Payrun Link */}
        <Link
          href="/payroll/payruns/new"
          className="h-9 px-4 rounded-[6px] bg-[#4F8CFF] hover:bg-[#3B78E7] text-white text-[12.5px] font-semibold tracking-wide transition-colors flex items-center space-x-1.5 shadow-sm shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>New</span>
        </Link>
      </div>
    </div>
  );
}

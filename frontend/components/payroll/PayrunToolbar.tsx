"use client";

import React from "react";
import Link from "next/link";

interface PayrunToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedYear: string;
  onYearChange: (value: string) => void;
  selectedState: string;
  onStateChange: (value: string) => void;
}

export default function PayrunToolbar({
  search,
  onSearchChange,
  selectedYear,
  onYearChange,
  selectedState,
  onStateChange,
}: PayrunToolbarProps) {
  return (
    <div className="bg-[#111827] border border-[#263449] rounded-[10px] p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 shadow-sm">
      {/* Left: New Button */}
      <Link
        href="/payroll/payruns/new"
        className="w-full sm:w-auto h-9 px-4 rounded-[6px] bg-[#4F8CFF] hover:bg-[#3B78E7] text-white text-[12.5px] font-semibold tracking-wide transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>New</span>
      </Link>

      {/* Right: Search & Filters */}
      <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5 flex-1 max-w-2xl justify-end">
        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search payruns..."
            className="w-full h-9 pl-9 pr-3 text-[12px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-colors"
          />
          <div className="absolute left-3 top-2.5 pointer-events-none text-[#64748B]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Year Dropdown */}
        <div className="relative w-full sm:w-36">
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full h-9 px-3 pr-8 text-[12px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] focus:outline-none focus:border-[#4F8CFF] appearance-none cursor-pointer"
          >
            <option value="all">All Years</option>
            <option value="2026">Year 2026</option>
            <option value="2025">Year 2025</option>
            <option value="2024">Year 2024</option>
          </select>
          <div className="absolute right-2.5 top-2.5 pointer-events-none text-[#64748B]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* State Filter Dropdown */}
        <div className="relative w-full sm:w-40">
          <select
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value)}
            className="w-full h-9 px-3 pr-8 text-[12px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] focus:outline-none focus:border-[#4F8CFF] appearance-none cursor-pointer"
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
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";

interface EmployeeToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeView: "kanban" | "list";
}

export default function EmployeeToolbar({
  searchQuery,
  onSearchChange,
  activeView,
}: EmployeeToolbarProps) {
  return (
    <div className="w-full mb-6">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#263449]/60 mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-[#F8FAFC] tracking-tight">
            Employees
          </h1>
          <p className="text-[12.5px] text-[#94A3B8] font-medium mt-0.5">
            Default View: <span className="text-[#4F8CFF] font-semibold">Kanban</span>
          </p>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Left Side: NEW Button & Search Input */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link
            href="/users"
            className="inline-flex items-center justify-center bg-[#4F8CFF] hover:bg-[#3B82F6] text-white font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-all shadow-sm active:scale-[0.98] shrink-0"
          >
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            NEW
          </Link>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-[320px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search employees..."
              className="w-full bg-[#111827] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] pl-9 pr-8 py-2 outline-none transition-colors placeholder-[#64748B]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#64748B] hover:text-[#F8FAFC] transition-colors"
                title="Clear search"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: View Switcher (Kanban / List) */}
        <div className="flex items-center bg-[#111827] border border-[#263449] p-1 rounded-[8px] shrink-0 self-start sm:self-auto">
          <button
            type="button"
            className={`inline-flex items-center px-3 py-1.5 rounded-[6px] text-[12.5px] font-medium transition-all ${
              activeView === "kanban"
                ? "bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30 font-semibold shadow-xs"
                : "text-[#A7B3C6] hover:text-[#F8FAFC]"
            }`}
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Kanban
          </button>
          <Link
            href="/users"
            className={`inline-flex items-center px-3 py-1.5 rounded-[6px] text-[12.5px] font-medium transition-all ${
              activeView === "list"
                ? "bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30 font-semibold shadow-xs"
                : "text-[#A7B3C6] hover:text-[#F8FAFC]"
            }`}
          >
            <svg
              className="w-3.5 h-3.5 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            List
          </Link>
        </div>
      </div>
    </div>
  );
}

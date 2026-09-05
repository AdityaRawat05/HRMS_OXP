"use client";

import React from "react";
import { WorkingScheduleRecord } from "../../lib/api";

interface WorkingScheduleListProps {
  schedules: WorkingScheduleRecord[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onSelectSchedule: (schedule: WorkingScheduleRecord) => void;
  onCreateNew: () => void;
  onDeleteSchedule: (scheduleId: number, e: React.MouseEvent) => void;
}

export default function WorkingScheduleList({
  schedules,
  loading,
  error,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectSchedule,
  onCreateNew,
  onDeleteSchedule,
}: WorkingScheduleListProps) {
  return (
    <div className="w-full">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-[#263449]/60 mb-6 gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-[#F8FAFC] tracking-tight">
            Working Schedules
          </h1>
          <p className="text-[12.5px] text-[#94A3B8] font-medium mt-0.5">
            Configure company work shifts, weekly hours, and daily working lines.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            onClick={onCreateNew}
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
            NEW SCHEDULE
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-6">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-[360px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search schedules or companies..."
            className="w-full bg-[#111827] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] pl-9 pr-8 py-2 outline-none transition-colors placeholder-[#64748B]"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#64748B] hover:text-[#F8FAFC] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center bg-[#111827] border border-[#263449] p-1 rounded-[8px]">
          {["all", "active", "inactive"].map((st) => (
            <button
              key={st}
              onClick={() => onStatusFilterChange(st)}
              className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium capitalize transition-all ${
                statusFilter === st
                  ? "bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30 font-semibold"
                  : "text-[#A7B3C6] hover:text-[#F8FAFC]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 animate-pulse space-y-4"
            >
              <div className="h-5 bg-[#1E293B] rounded w-3/4"></div>
              <div className="h-4 bg-[#1E293B] rounded w-1/2"></div>
              <div className="h-4 bg-[#1E293B] rounded w-1/3 mt-4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="w-full bg-[#111827] border border-[#EF4444]/30 rounded-[12px] p-8 text-center my-4">
          <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">
            Unable to load working schedules
          </h3>
          <p className="text-[13px] text-[#94A3B8] mb-4 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && schedules.length === 0 && (
        <div className="w-full bg-[#111827] border border-[#263449] rounded-[12px] p-12 text-center my-4">
          <div className="w-12 h-12 rounded-full bg-[#172033] text-[#64748B] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">
            {searchQuery ? "No working schedules match your search." : "No working schedules found"}
          </h3>
          <p className="text-[13px] text-[#94A3B8] mb-4">
            {searchQuery ? `No records found for "${searchQuery}".` : "Create your first company working schedule to get started."}
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-2 bg-[#4F8CFF] hover:bg-[#3B82F6] text-white text-[13px] font-semibold rounded-[8px] transition-colors"
          >
            Create New Schedule
          </button>
        </div>
      )}

      {/* Schedule Cards Grid */}
      {!loading && !error && schedules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {schedules.map((schedule) => {
            const totalHours = schedule.total_weekly_hours ?? 0;
            const daysPerWeek = schedule.days_per_week ?? (schedule.lines ? schedule.lines.filter(l => l.is_working_day).length : 5);
            const companyName = schedule.company_name || schedule.company?.name || "PeoplePay360 Inc.";

            return (
              <div
                key={schedule.id}
                onClick={() => onSelectSchedule(schedule)}
                className="group cursor-pointer bg-[#111827] border border-[#263449] hover:border-[#4F8CFF]/60 rounded-[12px] p-5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Name & Active Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-[15.5px] font-bold text-[#F8FAFC] group-hover:text-[#4F8CFF] transition-colors truncate">
                        {schedule.name}
                      </h3>
                      {schedule.is_default && (
                        <span className="px-2 py-0.5 rounded-[4px] text-[10.5px] font-bold bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30">
                          DEFAULT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          schedule.is_active ? "bg-[#22C55E]" : "bg-[#64748B]"
                        }`}
                      ></span>
                      <span
                        className={`text-[12px] font-medium ${
                          schedule.is_active ? "text-[#22C55E]" : "text-[#94A3B8]"
                        }`}
                      >
                        {schedule.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Company Name */}
                  <p className="text-[13px] text-[#A7B3C6] font-medium mb-4 truncate">
                    {companyName}
                  </p>
                </div>

                {/* Key Schedule Stats Box */}
                <div className="bg-[#0B1220] border border-[#1E293B] rounded-[8px] p-3 grid grid-cols-2 gap-2 text-center mb-4">
                  <div>
                    <span className="block text-[11px] uppercase tracking-wider text-[#64748B] font-semibold">
                      Hours / Week
                    </span>
                    <span className="text-[16px] font-bold text-[#4F8CFF] mt-0.5 block">
                      {totalHours}h
                    </span>
                  </div>
                  <div className="border-l border-[#1E293B] pl-2">
                    <span className="block text-[11px] uppercase tracking-wider text-[#64748B] font-semibold">
                      Days / Week
                    </span>
                    <span className="text-[16px] font-bold text-[#F8FAFC] mt-0.5 block">
                      {daysPerWeek} Days
                    </span>
                  </div>
                </div>

                {/* Footer Meta & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1E293B] text-[12px] text-[#64748B]">
                  <span className="truncate max-w-[150px]">
                    Timezone: {schedule.timezone || "Asia/Kolkata"}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => onDeleteSchedule(schedule.id, e)}
                      className="p-1 text-[#64748B] hover:text-[#EF4444] transition-colors rounded hover:bg-[#1E293B]"
                      title="Delete or Deactivate Schedule"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { getEmployeesApi, EmployeeOption } from "../../lib/api";

interface AttendanceToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedEmployeeId: string;
  onEmployeeChange: (empId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onOpenNew: () => void;
  onResetFilters: () => void;
}

export default function AttendanceToolbar({
  searchQuery,
  onSearchChange,
  selectedDate,
  onDateChange,
  selectedEmployeeId,
  onEmployeeChange,
  selectedStatus,
  onStatusChange,
  onOpenNew,
  onResetFilters,
}: AttendanceToolbarProps) {
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeOption[]>([]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await getEmployeesApi();
        if (res.success && res.data?.employees) {
          setEmployeeOptions(res.data.employees);
        }
      } catch (err) {
        console.error("Failed to load employee filter options:", err);
      }
    }
    loadEmployees();
  }, []);

  const handleTodayClick = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    onDateChange(todayStr);
  };

  const hasActiveFilters = Boolean(searchQuery || selectedDate || selectedEmployeeId || selectedStatus !== "all");

  return (
    <div className="w-full mb-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#263449]/60 mb-5">
        <div>
          <h1 className="text-[22px] font-bold text-[#F8FAFC] tracking-tight">
            Attendance
          </h1>
          <p className="text-[12.5px] text-[#94A3B8] font-medium mt-0.5">
            List view of employee attendance records
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-3 sm:mt-0">
          <button
            onClick={onOpenNew}
            className="inline-flex items-center justify-center bg-[#4F8CFF] hover:bg-[#3B82F6] text-white font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-all shadow-sm active:scale-[0.98] shrink-0"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            NEW
          </button>
        </div>
      </div>

      {/* Toolbar Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Search & Today Button */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-[320px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search attendance..."
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

          {/* Today Button */}
          <button
            type="button"
            onClick={handleTodayClick}
            className={`px-3 py-2 rounded-[8px] text-[12.5px] font-semibold transition-all border ${
              selectedDate === new Date().toISOString().split("T")[0]
                ? "bg-[#4F8CFF]/15 text-[#4F8CFF] border-[#4F8CFF]/40"
                : "bg-[#111827] border-[#263449] text-[#A7B3C6] hover:text-[#F8FAFC]"
            }`}
          >
            Today
          </button>

          {/* Date Picker Input */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-[#111827] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[12.5px] rounded-[8px] px-3 py-2 outline-none"
          />
        </div>

        {/* Right Side: Employee Selector & Status Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Employee Selector */}
          <div className="flex items-center space-x-2 bg-[#111827] border border-[#263449] rounded-[8px] px-3 py-1.5">
            <span className="text-[12px] text-[#64748B] font-medium shrink-0">Employee:</span>
            <select
              value={selectedEmployeeId}
              onChange={(e) => onEmployeeChange(e.target.value)}
              className="bg-transparent text-[#F8FAFC] text-[12.5px] outline-none font-medium max-w-[160px] truncate"
            >
              <option value="" className="bg-[#111827] text-[#F8FAFC]">All Employees</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id} className="bg-[#111827] text-[#F8FAFC]">
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-[#111827] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[12.5px] font-medium rounded-[8px] px-3 py-2 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="on_leave">On Leave</option>
          </select>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="px-2.5 py-2 text-[12px] text-[#A7B3C6] hover:text-[#EF4444] transition-colors"
              title="Reset all filters"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

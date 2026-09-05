"use client";

import React from "react";
import EmployeeKanbanCard from "./EmployeeKanbanCard";
import { EmployeeKanbanRecord } from "../../lib/api";

interface EmployeeKanbanListProps {
  employees: EmployeeKanbanRecord[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onClearSearch: () => void;
  onRetry: () => void;
}

export default function EmployeeKanbanList({
  employees,
  loading,
  error,
  searchQuery,
  onClearSearch,
  onRetry,
}: EmployeeKanbanListProps) {
  // 1. Loading State: Render 6 Skeleton Cards
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 w-full">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 animate-pulse flex items-start space-x-4"
          >
            <div className="w-12 h-12 rounded-full bg-[#1E293B] shrink-0"></div>
            <div className="flex-1 space-y-2.5">
              <div className="h-4 bg-[#1E293B] rounded w-3/4"></div>
              <div className="h-3 bg-[#1E293B] rounded w-1/2"></div>
              <div className="h-4 bg-[#1E293B] rounded w-1/4 mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="w-full bg-[#111827] border border-[#EF4444]/30 rounded-[12px] p-8 text-center my-4">
        <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">
          Unable to load employees
        </h3>
        <p className="text-[13px] text-[#94A3B8] mb-4 max-w-md mx-auto">
          {error || "Unable to load employees. Please try again."}
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-[#172033] border border-[#263449] hover:bg-[#1E293B] text-[#F8FAFC] text-[13px] font-medium rounded-[8px] transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (!employees || employees.length === 0) {
    return (
      <div className="w-full bg-[#111827] border border-[#263449] rounded-[12px] p-12 text-center my-4">
        <div className="w-12 h-12 rounded-full bg-[#172033] text-[#64748B] flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">
          {searchQuery ? "No employees match your search." : "No employees found"}
        </h3>
        <p className="text-[13px] text-[#94A3B8] mb-4">
          {searchQuery
            ? `No records found matching "${searchQuery}".`
            : "There are currently no active employee records in the system."}
        </p>
        {searchQuery && (
          <button
            onClick={onClearSearch}
            className="inline-flex items-center px-3.5 py-1.5 bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30 hover:bg-[#4F8CFF]/25 text-[12.5px] font-medium rounded-[6px] transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  // 4. Kanban Card Grid View (2-Column Desktop, 1-Column Mobile)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 w-full">
      {employees.map((employee) => (
        <EmployeeKanbanCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}

"use client";

import React from "react";

interface PayrollDashboardErrorProps {
  message?: string | null;
  onRetry: () => void;
}

export default function PayrollDashboardError({
  message,
  onRetry,
}: PayrollDashboardErrorProps) {
  return (
    <div className="w-full bg-[#111827] border border-[#EF4444]/30 rounded-[12px] p-8 text-center my-6 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto mb-3">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-[16px] font-bold text-[#F8FAFC] mb-1">
        Unable to load payroll dashboard
      </h3>
      <p className="text-[13px] text-[#A7B3C6] mb-5 max-w-md mx-auto">
        {message || "An unexpected error occurred while fetching payroll aggregation data."}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 bg-[#4F8CFF] hover:bg-[#3B82F6] text-white text-[13px] font-semibold rounded-[8px] transition-all shadow-sm active:scale-[0.98]"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Retry Loading
      </button>
    </div>
  );
}

"use client";

import React from "react";

export default function PayrollDashboardSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Filter Bar Skeleton */}
      <div className="bg-[#111827] border border-[#263449] p-4 rounded-[12px] flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-9 w-36 bg-[#172033] rounded-[8px]"></div>
          ))}
        </div>
        <div className="h-8 w-24 bg-[#172033] rounded-[8px]"></div>
      </div>

      {/* KPI Cards Skeleton (5 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-[#111827] border border-[#263449] p-4 rounded-[12px] space-y-3"
          >
            <div className="h-3 bg-[#172033] rounded w-2/3"></div>
            <div className="h-7 bg-[#172033] rounded w-4/5"></div>
            <div className="h-3 bg-[#172033] rounded w-1/2"></div>
          </div>
        ))}
      </div>

      {/* Row 1 Charts Skeleton (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-[#111827] border border-[#263449] p-5 rounded-[12px] space-y-4"
          >
            <div className="h-4 bg-[#172033] rounded w-1/2"></div>
            <div className="h-48 bg-[#172033] rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Row 2 Overviews Skeleton (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-[#111827] border border-[#263449] p-5 rounded-[12px] space-y-4"
          >
            <div className="h-4 bg-[#172033] rounded w-1/3"></div>
            <div className="h-40 bg-[#172033] rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

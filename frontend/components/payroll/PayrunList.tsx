"use client";

import React, { useState, useEffect, useCallback } from "react";
import PayrunToolbar from "./PayrunToolbar";
import PayrunCard from "./PayrunCard";
import { PayrunRecord, getPayrunsApi } from "../../lib/api";

export default function PayrunList() {
  const [payruns, setPayruns] = useState<PayrunRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");

  const fetchPayruns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayrunsApi(search, selectedYear, selectedState);
      if (!res.success) {
        setError(res.error || "Failed to load payruns.");
      } else {
        setPayruns(res.data?.payruns || []);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching payruns.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedYear, selectedState]);

  useEffect(() => {
    fetchPayruns();
  }, [fetchPayruns]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Page Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-[24px] font-extrabold text-[#F8FAFC] tracking-tight">Payruns</h1>
        <p className="text-[13px] text-[#A7B3C6] mt-0.5">Payrun view for payroll periods</p>
      </div>

      {/* Toolbar with Search, Year, and Status Filters */}
      <PayrunToolbar
        search={search}
        onSearchChange={setSearch}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedState={selectedState}
        onStateChange={setSelectedState}
      />

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-[8px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[13px] leading-relaxed flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchPayruns}
            className="text-[12px] underline hover:no-underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 animate-pulse h-48 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 bg-[#172033] rounded w-3/4"></div>
                <div className="h-3 bg-[#172033] rounded w-1/2"></div>
              </div>
              <div className="h-10 bg-[#172033] rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : payruns.length === 0 ? (
        /* Empty State */
        <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-12 text-center max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-[#172033] text-[#4F8CFF] flex items-center justify-center mx-auto mb-4 border border-[#263449]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-[16px] font-bold text-[#F8FAFC] mb-1">No Payruns Found</h3>
          <p className="text-[12.5px] text-[#A7B3C6] mb-6">
            No payroll records match your criteria. Click below to create a new payrun.
          </p>
          <a
            href="/payroll/payruns/new"
            className="inline-flex items-center justify-center px-4 h-9 rounded-[6px] bg-[#4F8CFF] hover:bg-[#3B78E7] text-white text-[12.5px] font-semibold transition-colors shadow-sm"
          >
            + Create New Payrun
          </a>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {payruns.map((payrun) => (
            <PayrunCard key={payrun.id} payrun={payrun} />
          ))}
        </div>
      )}
    </div>
  );
}

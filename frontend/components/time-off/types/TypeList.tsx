"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTimeOffTypesApi, TimeOffTypeRecord } from "../../../lib/api";

export default function TypeList() {
  const router = useRouter();
  const [types, setTypes] = useState<TimeOffTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTimeOffTypesApi({
        search: searchQuery,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setTypes(res.data);
      } else {
        setError(res.error || "Unable to load time off types.");
        setTypes([]);
      }
    } catch (err: any) {
      console.error("Fetch time off types error:", err);
      setError("Unable to load time off types. Please try again.");
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTypes();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTypes]);

  return (
    <div className="w-full space-y-6">
      {/* Top Toolbar */}
      <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] pl-10 pr-4 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all placeholder-[#64748B]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[#64748B] text-[12px] font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all appearance-none pr-8 cursor-pointer relative"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1.2em 1.2em",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => router.push("/time-off/types/new")}
          className="px-4 py-2 bg-[#4F8CFF] hover:bg-[#3B82F6] text-white text-[13px] font-semibold rounded-[8px] transition-colors whitespace-nowrap shadow-sm shadow-[#4F8CFF]/20 flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>NEW TYPE</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-[#111827] border border-[#263449] rounded-[12px] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-[#64748B]">
              <div className="w-5 h-5 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[13px] font-medium">Loading types...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[#EF4444] text-[13px]">{error}</div>
        ) : types.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#172033] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">No time off types found</h3>
            <p className="text-[13px] text-[#94A3B8]">Get started by creating a new time off type.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#172033] border-b border-[#263449]">
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Code</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Requires Approval</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263449]">
                {types.map((type) => (
                  <tr key={type.id} className="hover:bg-[#172033]/50 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="text-[14px] font-semibold text-[#F8FAFC]">{type.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[13px] font-mono text-[#94A3B8]">{type.code}</span>
                    </td>
                    <td className="py-3 px-4">
                      {type.requires_approval ? (
                        <span className="inline-flex items-center space-x-1 text-[#F59E0B] text-[12px] font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[#22C55E] text-[12px] font-medium">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>No</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {type.is_active ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-[11px] font-semibold border border-[#22C55E]/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[11px] font-semibold border border-[#EF4444]/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/time-off/types/${type.id}`}
                        className="text-[13px] font-medium text-[#4F8CFF] hover:text-[#3B82F6] transition-colors"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

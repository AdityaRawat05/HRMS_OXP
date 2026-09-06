"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTimeOffRequestsApi, TimeOffRequestRecord, getCurrentUserApi } from "../../../lib/api";

export default function RequestList() {
  const router = useRouter();
  const [requests, setRequests] = useState<TimeOffRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [isMyTeam, setIsMyTeam] = useState(false);
  const [canManageTeam, setCanManageTeam] = useState(false);

  const fetchUserRole = async () => {
    try {
      const res = await getCurrentUserApi();
      if (res.success && res.data) {
        // Assume users with HR Admin, Manager, or Admin roles can manage a team
        const roles = res.data.roles.map(r => r.name);
        if (roles.includes("hr_admin") || roles.includes("admin") || roles.includes("manager")) {
          setCanManageTeam(true);
        }
      }
    } catch (err) {}
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTimeOffRequestsApi({
        search: searchQuery,
        state: selectedState !== "all" ? selectedState : undefined,
        myTeam: isMyTeam,
      });

      if (res.success && Array.isArray(res.data)) {
        setRequests(res.data);
      } else {
        setError(res.error || "Unable to load requests.");
        setRequests([]);
      }
    } catch (err: any) {
      console.error("Fetch requests error:", err);
      setError("Unable to load requests. Please try again.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedState, isMyTeam]);

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchRequests]);

  return (
    <div className="w-full space-y-6">
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
              placeholder="Search employee or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] pl-10 pr-4 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all placeholder-[#64748B]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[#64748B] text-[12px] font-medium">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all appearance-none pr-8 cursor-pointer relative"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                backgroundSize: "1.2em 1.2em",
              }}
            >
              <option value="all">All States</option>
              <option value="approved">Approved</option>
              <option value="draft">To Approve</option>
              <option value="refused">Refused</option>
            </select>
          </div>

          {canManageTeam && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMyTeam}
                onChange={(e) => setIsMyTeam(e.target.checked)}
                className="w-4 h-4 rounded border-[#263449] bg-[#0F172A] text-[#4F8CFF] focus:ring-[#4F8CFF] focus:ring-offset-0 transition-colors"
              />
              <span className="text-[13px] font-medium text-[#F8FAFC]">My Team</span>
            </label>
          )}
        </div>
        <button
          onClick={() => router.push("/time-off/requests/new")}
          className="px-4 py-2 bg-[#4F8CFF] hover:bg-[#3B82F6] text-white text-[13px] font-semibold rounded-[8px] transition-colors whitespace-nowrap shadow-sm shadow-[#4F8CFF]/20 flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>NEW REQUEST</span>
        </button>
      </div>

      <div className="bg-[#111827] border border-[#263449] rounded-[12px] overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-[#64748B]">
              <div className="w-5 h-5 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[13px] font-medium">Loading requests...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-[#EF4444] text-[13px]">{error}</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#172033] flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">No requests found</h3>
            <p className="text-[13px] text-[#94A3B8]">There are no time off requests matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#172033] border-b border-[#263449]">
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Employee</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Time Off Type</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Dates</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Days</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263449]">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#172033]/50 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="text-[14px] font-medium text-[#F8FAFC]">{req.employee?.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[13px] text-[#A7B3C6]">{req.time_off_type?.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[13px] text-[#64748B] truncate max-w-[200px]" title={req.description}>
                        {req.description || "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[12px] text-[#64748B]">
                        {new Date(req.date_from).toLocaleDateString()} - {new Date(req.date_to).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[13px] font-medium text-[#F8FAFC]">{req.days_requested}</span>
                    </td>
                    <td className="py-3 px-4">
                      {req.state === "approved" && (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-[11px] font-semibold border border-[#22C55E]/20">
                          Approved
                        </span>
                      )}
                      {req.state === "draft" && (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-[11px] font-semibold border border-[#F59E0B]/20">
                          To Approve
                        </span>
                      )}
                      {req.state === "refused" && (
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[11px] font-semibold border border-[#EF4444]/20">
                          Refused
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/time-off/requests/${req.id}`}
                        className="text-[13px] font-medium text-[#4F8CFF] hover:text-[#3B82F6] transition-colors"
                      >
                        View
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

"use client";

import React, { useState, useEffect, useCallback } from "react";
import AttendanceToolbar from "./AttendanceToolbar";
import AttendanceTable from "./AttendanceTable";
import AttendanceWidget from "./AttendanceWidget";
import AttendanceForm from "./AttendanceForm";
import { getAttendanceListApi, AttendanceRecord } from "../../lib/api";

export default function AttendanceList() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [showWidget, setShowWidget] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAttendanceListApi({
        search: searchQuery,
        date: selectedDate || undefined,
        employeeId: selectedEmployeeId || undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setRecords(res.data);
      } else {
        setError(res.error || "Unable to load attendance records.");
        setRecords([]);
      }
    } catch (err: any) {
      console.error("Fetch attendance records error:", err);
      setError("Unable to load attendance records. Please try again.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDate, selectedEmployeeId, selectedStatus]);

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDate("");
    setSelectedEmployeeId("");
    setSelectedStatus("all");
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Toolbar */}
      <AttendanceToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedEmployeeId={selectedEmployeeId}
        onEmployeeChange={setSelectedEmployeeId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onOpenNew={() => setShowFormModal(true)}
        onResetFilters={handleResetFilters}
      />

      {/* Widget & Layout Grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left / Main Section: Attendance Table */}
        <div className="flex-1 w-full space-y-4">
          {loading && (
            <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-6 animate-pulse space-y-4">
              <div className="h-5 bg-[#1E293B] rounded w-1/4"></div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-[#1E293B] rounded w-full"></div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="w-full bg-[#111827] border border-[#EF4444]/30 rounded-[12px] p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">
                Unable to load attendance records
              </h3>
              <p className="text-[13px] text-[#94A3B8] mb-4 max-w-md mx-auto">{error}</p>
              <button
                onClick={fetchRecords}
                className="px-4 py-2 bg-[#172033] border border-[#263449] hover:bg-[#1E293B] text-[#F8FAFC] text-[13px] font-medium rounded-[8px] transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && records.length === 0 && (
            <div className="w-full bg-[#111827] border border-[#263449] rounded-[12px] p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#172033] text-[#64748B] flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">
                No attendance records found.
              </h3>
              <p className="text-[13px] text-[#94A3B8] mb-4">
                {searchQuery || selectedDate || selectedEmployeeId
                  ? "No records match your active search or filters."
                  : "There are currently no attendance entries in the system."}
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setShowFormModal(true)}
                  className="px-4 py-2 bg-[#4F8CFF] hover:bg-[#3B82F6] text-white text-[13px] font-semibold rounded-[8px] transition-colors"
                >
                  NEW
                </button>
                {hasActiveFilters(searchQuery, selectedDate, selectedEmployeeId, selectedStatus) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-[#172033] border border-[#263449] text-[#A7B3C6] hover:text-[#F8FAFC] text-[13px] font-medium rounded-[8px] transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <AttendanceTable records={records} />
          )}
        </div>

        {/* Right Section: Attendance Self-Service Widget Card */}
        {showWidget && (
          <div className="shrink-0 w-full lg:w-auto">
            <AttendanceWidget onStatusChange={fetchRecords} />
          </div>
        )}
      </div>

      {/* Manual Attendance Record Modal */}
      {showFormModal && (
        <AttendanceForm
          onClose={() => setShowFormModal(false)}
          onSaved={() => {
            setShowFormModal(false);
            fetchRecords();
          }}
        />
      )}
    </div>
  );
}

function hasActiveFilters(s: string, d: string, e: string, st: string) {
  return Boolean(s || d || e || st !== "all");
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PayrollNav from "../../../components/payroll/PayrollNav";
import WorkingScheduleList from "../../../components/schedules/WorkingScheduleList";
import WorkingScheduleForm from "../../../components/schedules/WorkingScheduleForm";
import {
  getWorkingSchedulesApi,
  getWorkingScheduleByIdApi,
  deleteWorkingScheduleApi,
  WorkingScheduleRecord,
  getCurrentUserApi,
} from "../../../lib/api";

export default function WorkingSchedulesPage() {
  const router = useRouter();

  const [authChecking, setAuthChecking] = useState(true);
  const [schedules, setSchedules] = useState<WorkingScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [selectedSchedule, setSelectedSchedule] = useState<WorkingScheduleRecord | null>(null);

  // 1. Session Verification
  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await getCurrentUserApi();
        if (!res.success || !res.data?.authenticated) {
          router.push("/login");
        } else {
          setAuthChecking(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      }
    }
    verifyAuth();
  }, [router]);

  // 2. Fetch Working Schedules from API
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWorkingSchedulesApi({
        search: searchQuery,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (res.success && Array.isArray(res.data)) {
        setSchedules(res.data);
      } else {
        setError(res.error || "Unable to load working schedules.");
        setSchedules([]);
      }
    } catch (err: any) {
      console.error("Error fetching working schedules:", err);
      setError("Unable to load working schedules. Please try again.");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  // Debounced search & filter trigger
  useEffect(() => {
    if (authChecking) return;
    const timer = setTimeout(() => {
      fetchSchedules();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, authChecking, fetchSchedules]);

  // Select schedule for form view
  const handleSelectSchedule = async (schedule: WorkingScheduleRecord) => {
    try {
      setLoading(true);
      const res = await getWorkingScheduleByIdApi(schedule.id);
      if (res.success && res.data) {
        setSelectedSchedule(res.data);
      } else {
        setSelectedSchedule(schedule);
      }
    } catch {
      setSelectedSchedule(schedule);
    } finally {
      setLoading(false);
      setViewMode("form");
    }
  };

  const handleCreateNew = () => {
    setSelectedSchedule(null);
    setViewMode("form");
  };

  const handleDeleteSchedule = async (scheduleId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const sched = schedules.find((s) => s.id === scheduleId);
    if (!confirm(`Are you sure you want to delete/deactivate "${sched?.name || "this schedule"}"?`)) {
      return;
    }

    try {
      const res = await deleteWorkingScheduleApi(scheduleId);
      if (res.success) {
        alert(res.data?.message || "Schedule processed successfully.");
        fetchSchedules();
      } else {
        alert(res.error || "Failed to delete schedule.");
      }
    } catch (err: any) {
      console.error("Delete schedule error:", err);
      alert("An error occurred while deleting.");
    }
  };

  if (authChecking) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center space-x-2.5 text-[#A7B3C6] text-[13px]">
          <div className="w-4 h-4 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying authentication...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      {/* Enterprise Header Navigation */}
      <PayrollNav />

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {viewMode === "list" ? (
          <WorkingScheduleList
            schedules={schedules}
            loading={loading}
            error={error}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onSelectSchedule={handleSelectSchedule}
            onCreateNew={handleCreateNew}
            onDeleteSchedule={handleDeleteSchedule}
          />
        ) : (
          <WorkingScheduleForm
            schedule={selectedSchedule}
            onBack={() => setViewMode("list")}
            onSaved={() => {
              setViewMode("list");
              fetchSchedules();
            }}
          />
        )}
      </div>
    </main>
  );
}

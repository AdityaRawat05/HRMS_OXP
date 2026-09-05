"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PayrollNav from "../../components/payroll/PayrollNav";
import EmployeeToolbar from "../../components/employees/EmployeeToolbar";
import EmployeeKanbanList from "../../components/employees/EmployeeKanbanList";
import {
  getEmployeesKanbanApi,
  EmployeeKanbanRecord,
  getCurrentUserApi,
} from "../../lib/api";

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeKanbanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // 2. Fetch Employee Records from API with Search
  const fetchEmployees = useCallback(async (searchVal: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEmployeesKanbanApi(searchVal);
      if (res.success && res.data?.employees) {
        setEmployees(res.data.employees);
      } else {
        setError(res.error || "Unable to load employees. Please try again.");
        setEmployees([]);
      }
    } catch (err: any) {
      console.error("Error fetching employees:", err);
      setError("Unable to load employees. Please try again.");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (authChecking) return;

    const handler = setTimeout(() => {
      fetchEmployees(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, authChecking, fetchEmployees]);

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
      {/* Enterprise Navigation Header */}
      <PayrollNav />

      {/* Main Page Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Toolbar & Controls */}
        <EmployeeToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeView="kanban"
        />

        {/* Employee Kanban Grid View */}
        <EmployeeKanbanList
          employees={employees}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
          onRetry={() => fetchEmployees(searchQuery)}
        />
      </div>
    </main>
  );
}

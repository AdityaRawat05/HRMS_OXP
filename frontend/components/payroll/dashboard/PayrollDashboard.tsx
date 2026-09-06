"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PayrollDashboardFilters from "./PayrollDashboardFilters";
import PayrollKpiCards from "./PayrollKpiCards";
import SalaryByDepartmentChart from "./SalaryByDepartmentChart";
import MonthlyNetSalaryChart from "./MonthlyNetSalaryChart";
import PayslipStatusPanel from "./PayslipStatusPanel";
import AttendanceOverview from "./AttendanceOverview";
import TimeOffOverview from "./TimeOffOverview";
import DepartmentOverview from "./DepartmentOverview";
import ModelsToAggregate from "./ModelsToAggregate";
import PayrollDashboardSkeleton from "./PayrollDashboardSkeleton";
import PayrollDashboardError from "./PayrollDashboardError";
import {
  getPayrollDashboardApi,
  PayrollDashboardData,
  getCurrentUserApi,
} from "../../../lib/api";

export default function PayrollDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dashboardData, setDashboardData] = useState<PayrollDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Filter States
  const [period, setPeriod] = useState<string>(searchParams?.get("period") || "");
  const [departmentId, setDepartmentId] = useState<string>(searchParams?.get("departmentId") || "all");
  const [employeeType, setEmployeeType] = useState<string>(searchParams?.get("employeeType") || "all");
  const [companyId, setCompanyId] = useState<string>(searchParams?.get("companyId") || "");

  // 1. Check Session & RBAC
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

  // 2. Fetch Dashboard Aggregations from API
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPermissionError(null);

    try {
      const res = await getPayrollDashboardApi({
        period,
        departmentId,
        employeeType,
        companyId,
      });

      if (res.success && res.data) {
        setDashboardData(res.data);
        // Sync active filter states from backend response if initial
        if (!period && res.data.filters.activeFilters.periodId) {
          setPeriod(String(res.data.filters.activeFilters.periodId));
        }
        if (!companyId && res.data.filters.activeFilters.companyId) {
          setCompanyId(String(res.data.filters.activeFilters.companyId));
        }
      } else {
        if (res.error?.includes("permission") || res.error?.includes("authorized")) {
          setPermissionError("You do not have permission to view the Payroll Dashboard.");
        } else {
          setError(res.error || "Unable to load payroll dashboard.");
        }
      }
    } catch (err: any) {
      console.error("Fetch dashboard error:", err);
      setError("Unable to load payroll dashboard.");
    } finally {
      setLoading(false);
    }
  }, [period, departmentId, employeeType, companyId]);

  useEffect(() => {
    if (!authChecking) {
      fetchDashboardData();
    }
  }, [authChecking, fetchDashboardData]);

  // Sync URL Query Parameters for sharing / bookmarking
  const updateUrlParams = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    Object.entries(newParams).forEach(([k, v]) => {
      if (v && v !== "all") {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    });
    router.replace(`/payroll/dashboard?${params.toString()}`);
  };

  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    updateUrlParams({ period: val, departmentId, employeeType, companyId });
  };

  const handleDeptChange = (val: string) => {
    setDepartmentId(val);
    updateUrlParams({ period, departmentId: val, employeeType, companyId });
  };

  const handleEmpTypeChange = (val: string) => {
    setEmployeeType(val);
    updateUrlParams({ period, departmentId, employeeType: val, companyId });
  };

  const handleCompanyChange = (val: string) => {
    setCompanyId(val);
    updateUrlParams({ period, departmentId, employeeType, companyId: val });
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

  if (permissionError) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-[#F8FAFC] mb-1">Access Restricted</h2>
          <p className="text-[13px] text-[#A7B3C6]">{permissionError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC] pb-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page Title & Subtitle */}
        <div className="pb-3 border-b border-[#263449]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-[24px] font-extrabold text-[#F8FAFC] tracking-tight">
              Payroll Dashboard
            </h1>
            <p className="text-[12.5px] text-[#A7B3C6] font-medium mt-0.5 max-w-3xl">
              Dashboard helps payroll/HR users understand payments, staffing impact, leave patterns, and attendance quality for the selected period.
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 self-start sm:self-auto bg-[#172033] hover:bg-[#1E293B] border border-[#263449] text-[#F8FAFC] text-[12.5px] font-medium px-3 py-1.5 rounded-[8px] transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters Bar */}
        {dashboardData && (
          <PayrollDashboardFilters
            filters={dashboardData.filters}
            selectedPeriod={period}
            selectedDept={departmentId}
            selectedEmpType={employeeType}
            selectedCompany={companyId}
            onPeriodChange={handlePeriodChange}
            onDeptChange={handleDeptChange}
            onEmpTypeChange={handleEmpTypeChange}
            onCompanyChange={handleCompanyChange}
            loading={loading}
          />
        )}

        {/* Dashboard Content OR Loading / Error State */}
        {loading && !dashboardData ? (
          <PayrollDashboardSkeleton />
        ) : error ? (
          <PayrollDashboardError message={error} onRetry={fetchDashboardData} />
        ) : dashboardData ? (
          <div className="space-y-6">
            {/* Top 5 KPI Cards */}
            <PayrollKpiCards kpis={dashboardData.kpis} />

            {/* Row 1: 3 Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <SalaryByDepartmentChart data={dashboardData.salaryByDepartment} />
              <MonthlyNetSalaryChart data={dashboardData.monthlyNetSalaryTrend} />
              <PayslipStatusPanel
                payslipStatus={dashboardData.payslipStatus}
                alerts={dashboardData.payrollAlerts}
              />
            </div>

            {/* Row 2: 3 Overviews */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <AttendanceOverview attendance={dashboardData.attendanceOverview} />
              <TimeOffOverview timeOff={dashboardData.timeOffOverview} />
              <DepartmentOverview departments={dashboardData.departmentOverview} />
            </div>

            {/* Explanatory Panel: Models to Aggregate */}
            <ModelsToAggregate />
          </div>
        ) : null}
      </div>
    </main>
  );
}

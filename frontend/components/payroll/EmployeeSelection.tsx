"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EmployeeSelectionTable from "./EmployeeSelectionTable";
import {
  EligibleEmployeeRecord,
  PayrollPeriodRecord,
  getPayrollPeriodsApi,
  getEligibleEmployeesApi,
  createPayrunApi,
} from "../../lib/api";

export default function EmployeeSelection() {
  const router = useRouter();

  const [periods, setPeriods] = useState<PayrollPeriodRecord[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

  const [employees, setEmployees] = useState<EligibleEmployeeRecord[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [search, setSearch] = useState<string>("");
  const [payrunName, setPayrunName] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load active Payroll Periods
  useEffect(() => {
    async function loadPeriods() {
      try {
        const res = await getPayrollPeriodsApi();
        if (res.success && res.data?.payroll_periods) {
          setPeriods(res.data.payroll_periods);
          if (res.data.payroll_periods.length > 0) {
            setSelectedPeriodId(res.data.payroll_periods[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load payroll periods:", err);
      }
    }
    loadPeriods();
  }, []);

  // Load eligible employees when period or search changes
  useEffect(() => {
    async function loadEmployees() {
      setLoading(true);
      setError(null);
      try {
        const res = await getEligibleEmployeesApi(selectedPeriodId, null, search);
        if (res.success && res.data?.employees) {
          setEmployees(res.data.employees);
          // By default, pre-select all eligible employees
          setSelectedEmpIds(res.data.employees.map((e) => e.id));
        } else {
          setError(res.error || "Failed to load eligible employees.");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching employees.");
      } finally {
        setLoading(false);
      }
    }
    loadEmployees();
  }, [selectedPeriodId, search]);

  const handleToggleSelect = (id: number) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter((item) => item !== id));
    } else {
      setSelectedEmpIds([...selectedEmpIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedEmpIds.length === employees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(employees.map((e) => e.id));
    }
  };

  const handleCreatePayrun = async () => {
    if (selectedEmpIds.length === 0 || !selectedPeriodId) return;

    setCreating(true);
    setError(null);

    try {
      const res = await createPayrunApi({
        payroll_period_id: selectedPeriodId,
        name: payrunName.trim() || undefined,
        employee_ids: selectedEmpIds,
      });

      if (!res.success || !res.data?.payrun) {
        setError(res.error || "Failed to create payrun.");
      } else {
        router.push(`/payroll/payruns/${res.data.payrun.id}`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setCreating(false);
    }
  };

  const activePeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Top Banner Info */}
      <div className="mb-6 bg-[#4F8CFF]/10 border border-[#4F8CFF]/30 rounded-[10px] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-[#4F8CFF]/20 text-[#4F8CFF] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-[#F8FAFC]">Select Employee Records</h2>
            <p className="text-[12px] text-[#A7B3C6]">The Payrun is created only after employee selection.</p>
          </div>
        </div>

        {/* Back Link */}
        <Link
          href="/payroll/payruns"
          className="text-[12px] font-semibold text-[#A7B3C6] hover:text-[#F8FAFC] flex items-center space-x-1 transition-colors bg-[#172033] px-3 py-1.5 rounded-[6px] border border-[#263449]"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to List</span>
        </Link>
      </div>

      {/* Form & Controls Card */}
      <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Period Selector */}
          <div>
            <label className="block text-[11.5px] font-medium text-[#A7B3C6] mb-1">Payroll Period *</label>
            <div className="relative">
              <select
                value={selectedPeriodId || ""}
                onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
                className="w-full h-9 px-3 pr-8 text-[12.5px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] focus:outline-none focus:border-[#4F8CFF]"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.date_from} → {p.date_to})
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-2.5 pointer-events-none text-[#64748B]">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Payrun Name (Optional Custom Name) */}
          <div>
            <label className="block text-[11.5px] font-medium text-[#A7B3C6] mb-1">Payrun Name (Optional)</label>
            <input
              type="text"
              value={payrunName}
              onChange={(e) => setPayrunName(e.target.value)}
              placeholder={activePeriod ? `${activePeriod.name} Payrun` : "e.g. February 2026 Regular Payrun"}
              className="w-full h-9 px-3 text-[12.5px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF]"
            />
          </div>

          {/* Employee Search */}
          <div>
            <label className="block text-[11.5px] font-medium text-[#A7B3C6] mb-1">Search Employee</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="w-full h-9 pl-9 pr-3 text-[12.5px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[6px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF]"
              />
              <div className="absolute left-3 top-2.5 pointer-events-none text-[#64748B]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Indicator Bar: Selection Count & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#263449] gap-3">
          <div className="text-[12.5px] text-[#A7B3C6]">
            Selected: <span className="font-bold text-[#F8FAFC]">{selectedEmpIds.length}</span> of{" "}
            <span className="font-bold text-[#F8FAFC]">{employees.length}</span> eligible employees
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <Link
              href="/payroll/payruns"
              className="w-1/2 sm:w-auto h-9 px-4 rounded-[6px] bg-[#172033] hover:bg-[#172033]/80 border border-[#263449] text-[#A7B3C6] hover:text-[#F8FAFC] text-[12.5px] font-semibold transition-colors flex items-center justify-center"
            >
              Back
            </Link>

            <button
              type="button"
              onClick={handleCreatePayrun}
              disabled={creating || selectedEmpIds.length === 0}
              className="w-1/2 sm:w-auto h-9 px-5 rounded-[6px] bg-[#4F8CFF] hover:bg-[#3B78E7] text-white text-[12.5px] font-semibold tracking-wide transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {creating ? (
                <span>Creating...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Create payrun</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-[8px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[13px] leading-relaxed">
          {error}
        </div>
      )}

      {/* Employee Table */}
      {loading ? (
        <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-8 text-center animate-pulse">
          <div className="h-6 bg-[#172033] rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-4 bg-[#172033] rounded w-1/2 mx-auto"></div>
        </div>
      ) : (
        <EmployeeSelectionTable
          employees={employees}
          selectedIds={selectedEmpIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          disabled={creating}
        />
      )}
    </div>
  );
}

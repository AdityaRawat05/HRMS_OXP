"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PayslipToolbar from "./PayslipToolbar";
import PayslipTable from "./PayslipTable";
import {
  PayslipListItemRecord,
  PayrollPeriodRecord,
  getPayslipsApi,
  getPayrollPeriodsApi,
} from "../../lib/api";

export default function PayslipList() {
  const router = useRouter();

  const [payslips, setPayslips] = useState<PayslipListItemRecord[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriodRecord[]>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Payroll Periods for filter dropdown
  useEffect(() => {
    async function loadPeriods() {
      try {
        const res = await getPayrollPeriodsApi();
        if (res.success && res.data?.payroll_periods) {
          setPeriods(res.data.payroll_periods);
        }
      } catch (err) {
        console.error("Failed to fetch periods:", err);
      }
    }
    loadPeriods();
  }, []);

  // Fetch Payslips list when filters or page change
  useEffect(() => {
    async function fetchPayslips() {
      setLoading(true);
      setError(null);
      try {
        const res = await getPayslipsApi(
          search,
          selectedPeriodId,
          null,
          selectedState,
          page
        );
        if (res.success && res.data) {
          setPayslips(res.data.payslips);
          setTotalPages(res.data.total_pages || 1);
        } else {
          setError(res.error || "Failed to load payslips.");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching payslips.");
      } finally {
        setLoading(false);
      }
    }
    fetchPayslips();
  }, [search, selectedPeriodId, selectedState, page]);

  const handleSelectPayslip = (id: string) => {
    router.push(`/payroll/payslips/${id}`);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Toolbar Header & Filters */}
      <PayslipToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        selectedPeriodId={selectedPeriodId}
        onPeriodChange={(id) => {
          setSelectedPeriodId(id);
          setPage(1);
        }}
        selectedState={selectedState}
        onStateChange={(st) => {
          setSelectedState(st);
          setPage(1);
        }}
        periods={periods}
      />

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-[8px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[13px] leading-relaxed">
          {error}
        </div>
      )}

      {/* Payslips Table */}
      <PayslipTable
        payslips={payslips}
        loading={loading}
        onSelectPayslip={handleSelectPayslip}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between text-[12.5px] text-[#A7B3C6]">
          <div>
            Page <span className="font-bold text-[#F8FAFC]">{page}</span> of{" "}
            <span className="font-bold text-[#F8FAFC]">{totalPages}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-[6px] bg-[#172033] border border-[#263449] text-[#A7B3C6] hover:text-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-[6px] bg-[#172033] border border-[#263449] text-[#A7B3C6] hover:text-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

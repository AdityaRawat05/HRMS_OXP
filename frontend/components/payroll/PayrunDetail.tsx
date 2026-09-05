"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PayrunActions from "./PayrunActions";
import PayrunWarnings from "./PayrunWarnings";
import { PayrunDetailRecord, getPayrunByIdApi, PayslipRecord } from "../../lib/api";

interface PayrunDetailProps {
  id: number;
}

export default function PayrunDetail({ id }: PayrunDetailProps) {
  const [payrun, setPayrun] = useState<PayrunDetailRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPayslipId, setExpandedPayslipId] = useState<string | null>(null);

  const fetchPayrunDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayrunByIdApi(id);
      if (!res.success || !res.data?.payrun) {
        setError(res.error || "Failed to load payrun details.");
      } else {
        setPayrun(res.data.payrun);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchPayrunDetails();
  }, [id, fetchPayrunDetails]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (valStr: string) => {
    const num = parseFloat(valStr || "0");
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case "paid":
        return (
          <span className="px-3 py-1 rounded-[6px] text-[12px] font-bold bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] tracking-wide uppercase">
            Paid
          </span>
        );
      case "validated":
        return (
          <span className="px-3 py-1 rounded-[6px] text-[12px] font-bold bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 text-[#4F8CFF] tracking-wide uppercase">
            Validated
          </span>
        );
      case "computed":
        return (
          <span className="px-3 py-1 rounded-[6px] text-[12px] font-bold bg-[#2DD4BF]/15 border border-[#2DD4BF]/30 text-[#2DD4BF] tracking-wide uppercase">
            Computed
          </span>
        );
      case "sent":
        return (
          <span className="px-3 py-1 rounded-[6px] text-[12px] font-bold bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7] tracking-wide uppercase">
            Sent
          </span>
        );
      case "draft":
      default:
        return (
          <span className="px-3 py-1 rounded-[6px] text-[12px] font-bold bg-[#718096]/15 border border-[#718096]/30 text-[#A7B3C6] tracking-wide uppercase">
            Draft
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-8 animate-pulse">
          <div className="h-6 bg-[#172033] rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-[#172033] rounded w-1/2 mb-8"></div>
          <div className="h-32 bg-[#172033] rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !payrun) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="bg-[#111827] border border-[#EF4444]/30 rounded-[12px] p-8 text-center max-w-md mx-auto">
          <h3 className="text-[16px] font-bold text-[#EF4444] mb-2">Error Loading Payrun</h3>
          <p className="text-[13px] text-[#A7B3C6] mb-6">{error || "Payrun record not found."}</p>
          <Link
            href="/payroll/payruns"
            className="inline-flex items-center justify-center px-4 h-9 rounded-[6px] bg-[#4F8CFF] hover:bg-[#3B78E7] text-white text-[12.5px] font-semibold transition-colors"
          >
            Back to Payruns List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-[12px] text-[#A7B3C6] mb-1">
            <Link href="/payroll/payruns" className="hover:text-[#4F8CFF] transition-colors">
              Payruns
            </Link>
            <span>/</span>
            <span className="text-[#F8FAFC] font-medium">{payrun.name || payrun.period_name}</span>
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-extrabold text-[#F8FAFC] tracking-tight">
            Payrun / {payrun.period_name || payrun.name}
          </h1>
          <p className="text-[12.5px] text-[#A7B3C6]">Open one Payrun to compute and manage its payslips</p>
        </div>

        <Link
          href="/payroll/payruns"
          className="text-[12px] font-semibold text-[#A7B3C6] hover:text-[#F8FAFC] bg-[#172033] border border-[#263449] px-3.5 py-2 rounded-[6px] transition-colors flex items-center space-x-1.5 w-fit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to List</span>
        </Link>
      </div>

      {/* Action Buttons Toolbar */}
      <PayrunActions
        payrunId={payrun.id}
        state={payrun.state}
        onActionCompleted={fetchPayrunDetails}
      />

      {/* Payrun Summary Card */}
      <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#263449]/80">
          <div>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#718096]">Reference</span>
            <div className="text-[15px] font-bold text-[#F8FAFC] font-mono mt-0.5">{payrun.reference}</div>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#718096]">Salary Structure</span>
            <div className="text-[13.5px] font-semibold text-[#F8FAFC] mt-0.5">{payrun.salary_structure_name}</div>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#718096]">Period</span>
            <div className="text-[13.5px] font-semibold text-[#F8FAFC] mt-0.5">
              {formatDate(payrun.date_from)} → {formatDate(payrun.date_to)}
            </div>
          </div>

          <div>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#718096] block mb-1">Status</span>
            {getStatusBadge(payrun.state)}
          </div>
        </div>

        {/* Totals Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-center sm:text-left">
          <div>
            <span className="text-[11px] text-[#A7B3C6] block font-medium">Total Payslips</span>
            <span className="text-[18px] font-bold text-[#F8FAFC]">{payrun.payslip_count}</span>
          </div>

          <div>
            <span className="text-[11px] text-[#A7B3C6] block font-medium">Total Gross</span>
            <span className="text-[18px] font-bold text-[#F8FAFC]">{formatCurrency(payrun.total_gross)}</span>
          </div>

          <div>
            <span className="text-[11px] text-[#A7B3C6] block font-medium">Total Deductions</span>
            <span className="text-[18px] font-bold text-[#EF4444]">{formatCurrency(payrun.total_deductions)}</span>
          </div>

          <div>
            <span className="text-[11px] text-[#A7B3C6] block font-medium">Total Net Payable</span>
            <span className="text-[18px] font-bold text-[#2DD4BF]">{formatCurrency(payrun.total_net)}</span>
          </div>
        </div>
      </div>

      {/* Payrun Warnings (if any) */}
      <PayrunWarnings warnings={payrun.warnings} />

      {/* Payslips in this Payrun Table */}
      <div className="bg-[#111827] border border-[#263449] rounded-[12px] overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-[#263449] flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#F8FAFC]">Payslips in this Payrun</h3>
          <span className="text-[12px] text-[#A7B3C6] font-medium">{payrun.payslips.length} items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#172033] border-b border-[#263449] text-[11px] font-semibold text-[#A7B3C6] uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Warnings</th>
                <th className="py-3 px-4">Worked Days</th>
                <th className="py-3 px-4 text-right">Basic</th>
                <th className="py-3 px-4 text-right">Gross</th>
                <th className="py-3 px-4 text-right">Net</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263449]/60 text-[12.5px]">
              {payrun.payslips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#718096]">
                    No payslips found in this payrun.
                  </td>
                </tr>
              ) : (
                payrun.payslips.map((ps) => {
                  const isExpanded = expandedPayslipId === ps.id;

                  return (
                    <React.Fragment key={ps.id}>
                      <tr className="hover:bg-[#172033]/50 transition-colors">
                        {/* Employee */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#F8FAFC]">{ps.employee_name}</div>
                          <div className="text-[11px] text-[#A7B3C6] font-mono">
                            {ps.employee_code} • {ps.work_email || "No email"}
                          </div>
                        </td>

                        {/* Warnings */}
                        <td className="py-3.5 px-4">
                          {ps.has_warnings ? (
                            <span className="text-[11px] font-semibold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/20">
                              Warning
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#718096]">None</span>
                          )}
                        </td>

                        {/* Worked Days */}
                        <td className="py-3.5 px-4 text-[#A7B3C6] font-medium">
                          {ps.days_worked} days
                        </td>

                        {/* Basic */}
                        <td className="py-3.5 px-4 text-right font-medium text-[#F8FAFC]">
                          {formatCurrency(ps.basic_salary)}
                        </td>

                        {/* Gross */}
                        <td className="py-3.5 px-4 text-right font-medium text-[#F8FAFC]">
                          {formatCurrency(ps.gross_salary)}
                        </td>

                        {/* Net */}
                        <td className="py-3.5 px-4 text-right font-bold text-[#2DD4BF]">
                          {formatCurrency(ps.net_salary)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#A7B3C6] bg-[#172033] px-2 py-0.5 rounded border border-[#263449]">
                            {ps.state}
                          </span>
                        </td>

                        {/* Action: Toggle Line Breakdown */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setExpandedPayslipId(isExpanded ? null : ps.id)}
                            className="text-[11.5px] font-semibold text-[#4F8CFF] hover:text-[#3B78E7] transition-colors"
                          >
                            {isExpanded ? "Hide Lines ▲" : "View Lines ▼"}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Salary Rule Lines Breakdown */}
                      {isExpanded && ps.lines && ps.lines.length > 0 && (
                        <tr className="bg-[#0F172A]/80">
                          <td colSpan={8} className="p-4 border-t border-b border-[#263449]">
                            <div className="text-[11.5px] font-bold text-[#4F8CFF] uppercase tracking-wider mb-2">
                              Salary Rule Calculation Lines ({ps.employee_name})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {ps.lines.map((line) => (
                                <div
                                  key={line.id}
                                  className="bg-[#172033] p-2.5 rounded-[6px] border border-[#263449] flex items-center justify-between text-[12px]"
                                >
                                  <div>
                                    <span className="font-semibold text-[#F8FAFC] block">{line.name}</span>
                                    <span className="text-[10px] text-[#718096] font-mono">{line.code} ({line.calculation_type})</span>
                                  </div>
                                  <span className="font-bold text-[#2DD4BF]">
                                    {formatCurrency(line.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

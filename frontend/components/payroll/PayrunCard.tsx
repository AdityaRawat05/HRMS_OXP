"use client";

import React from "react";
import Link from "next/link";
import { PayrunRecord } from "../../lib/api";

interface PayrunCardProps {
  payrun: PayrunRecord;
}

export default function PayrunCard({ payrun }: PayrunCardProps) {
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
          <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
            Paid
          </span>
        );
      case "validated":
        return (
          <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#4F8CFF]/15 border border-[#4F8CFF]/30 text-[#4F8CFF]">
            Validated
          </span>
        );
      case "computed":
        return (
          <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#2DD4BF]/15 border border-[#2DD4BF]/30 text-[#2DD4BF]">
            Computed
          </span>
        );
      case "sent":
        return (
          <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#A855F7]/15 border border-[#A855F7]/30 text-[#A855F7]">
            Sent
          </span>
        );
      case "draft":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#718096]/15 border border-[#718096]/30 text-[#A7B3C6]">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="bg-[#111827] border border-[#263449] hover:border-[#4F8CFF]/50 rounded-[12px] p-5 flex flex-col justify-between transition-all hover:shadow-md group">
      <div>
        {/* Top Row: Period Name & Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="text-[15px] font-bold text-[#F8FAFC] group-hover:text-[#4F8CFF] transition-colors leading-tight">
              {payrun.name || payrun.period_name}
            </h4>
            <p className="text-[11.5px] text-[#A7B3C6] font-medium mt-0.5">
              Ref: <span className="font-mono text-[11px]">{payrun.reference}</span>
            </p>
          </div>
          {getStatusBadge(payrun.state)}
        </div>

        {/* Date Range */}
        <div className="flex items-center space-x-1.5 text-[12px] text-[#A7B3C6] mb-4 bg-[#172033] px-2.5 py-1.5 rounded-[6px] w-fit border border-[#263449]">
          <svg className="w-3.5 h-3.5 text-[#4F8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">
            {formatDate(payrun.date_from)} → {formatDate(payrun.date_to)}
          </span>
        </div>

        {/* Info Grid: Employees, Net Total, Warnings */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-b border-[#263449]/70 mb-4">
          <div>
            <span className="block text-[10.5px] font-medium text-[#718096] uppercase tracking-wider">Employees</span>
            <span className="text-[14px] font-bold text-[#F8FAFC]">
              {payrun.payslip_count} {payrun.payslip_count === 1 ? "employee" : "employees"}
            </span>
          </div>

          <div>
            <span className="block text-[10.5px] font-medium text-[#718096] uppercase tracking-wider">Total Net</span>
            <span className="text-[14px] font-bold text-[#2DD4BF]">
              {formatCurrency(payrun.total_net)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Row: Warning Badge & Open Action Link */}
      <div className="flex items-center justify-between pt-1">
        {payrun.warning_count > 0 ? (
          <div className="flex items-center space-x-1.5 text-[#F59E0B] text-[11.5px] font-medium bg-[#F59E0B]/10 px-2 py-0.5 rounded-[4px] border border-[#F59E0B]/20">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{payrun.warning_count} {payrun.warning_count === 1 ? "warning" : "warnings"}</span>
          </div>
        ) : (
          <span className="text-[11.5px] text-[#718096] font-medium">No warnings</span>
        )}

        <Link
          href={`/payroll/payruns/${payrun.id}`}
          className="text-[12px] font-semibold text-[#4F8CFF] hover:text-[#3B78E7] flex items-center space-x-1 transition-colors"
        >
          <span>Open Payrun</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

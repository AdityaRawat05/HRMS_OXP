"use client";

import React from "react";
import useRouter from "next/navigation";
import { PayslipListItemRecord } from "../../lib/api";

interface PayslipTableProps {
  payslips: PayslipListItemRecord[];
  loading?: boolean;
  onSelectPayslip: (id: string) => void;
}

export default function PayslipTable({
  payslips,
  loading = false,
  onSelectPayslip,
}: PayslipTableProps) {
  const formatCurrency = (val: string) => {
    const num = parseFloat(val || "0");
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case "paid":
      case "sent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 capitalize">
            {state === "sent" ? "Sent / Paid" : "Paid"}
          </span>
        );
      case "validated":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30 capitalize">
            Validated
          </span>
        );
      case "computed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30 capitalize">
            Computed
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#172033] text-[#A7B3C6] border border-[#263449] capitalize">
            Draft
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-8 text-center animate-pulse">
        <div className="h-6 bg-[#172033] rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-4 bg-[#172033] rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-[#263449] rounded-[12px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#172033] border-b border-[#263449] text-[11px] font-semibold text-[#A7B3C6] uppercase tracking-wider">
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-3 text-center w-20">Warning</th>
              <th className="py-3 px-4">Period</th>
              <th className="py-3 px-4 text-right">Basic</th>
              <th className="py-3 px-4 text-right">Gross</th>
              <th className="py-3 px-4 text-right">Net</th>
              <th className="py-3 px-4">Structure</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263449]/60 text-[12.5px]">
            {payslips.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#718096]">
                  No payslips found matching your filters.
                </td>
              </tr>
            ) : (
              payslips.map((ps) => (
                <tr
                  key={ps.id}
                  onClick={() => onSelectPayslip(ps.id)}
                  className="hover:bg-[#172033]/60 transition-colors cursor-pointer"
                >
                  {/* Employee info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#172033] border border-[#263449] flex items-center justify-center text-[11.5px] font-bold text-[#4F8CFF] shrink-0">
                        {ps.employee_name?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-[#F8FAFC]">
                          {ps.employee_name}
                        </div>
                        <div className="text-[11px] text-[#A7B3C6] font-mono">
                          {ps.employee_code} • {ps.department_name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Warning column */}
                  <td className="py-3.5 px-3 text-center">
                    {ps.has_warnings ? (
                      <span
                        title={`${ps.warning_count} unresolved issue(s)`}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-[11px] font-bold border border-[#F59E0B]/40"
                      >
                        ⚠️
                      </span>
                    ) : (
                      <span className="text-[#718096] text-[12px]">-</span>
                    )}
                  </td>

                  {/* Period */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#F8FAFC]">
                      {ps.period_name}
                    </div>
                    <div className="text-[10.5px] text-[#A7B3C6] font-mono">
                      {ps.period_date_from} → {ps.period_date_to}
                    </div>
                  </td>

                  {/* Basic */}
                  <td className="py-3.5 px-4 text-right text-[#A7B3C6] font-mono font-medium">
                    {formatCurrency(ps.basic_salary)}
                  </td>

                  {/* Gross */}
                  <td className="py-3.5 px-4 text-right text-[#A7B3C6] font-mono font-medium">
                    {formatCurrency(ps.gross_salary)}
                  </td>

                  {/* Net */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#2DD4BF]">
                    {formatCurrency(ps.net_salary)}
                  </td>

                  {/* Salary Structure */}
                  <td className="py-3.5 px-4 text-[#A7B3C6] text-[12px] truncate max-w-[150px]">
                    {ps.salary_structure_name}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    {getStatusBadge(ps.state)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import PayrollAlerts from "./PayrollAlerts";
import { PayrollDashboardData } from "../../../lib/api";

interface PayslipStatusPanelProps {
  payslipStatus: PayrollDashboardData["payslipStatus"];
  alerts: PayrollDashboardData["payrollAlerts"];
}

export default function PayslipStatusPanel({ payslipStatus, alerts }: PayslipStatusPanelProps) {
  const { total, paid, pending, draft, computed, validated, cancelled } = payslipStatus;
  const totalCount = total || 1;

  const paidPct = Math.round((paid / totalCount) * 100);
  const pendingPct = Math.round((pending / totalCount) * 100);
  const cancelledPct = Math.max(0, 100 - paidPct - pendingPct);

  return (
    <div className="bg-[#111827] border border-[#263449] p-5 rounded-[12px] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between pb-3 border-b border-[#263449]/60 mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#F8FAFC]">
              Payslip Status & Payroll Alerts
            </h3>
            <p className="text-[11.5px] text-[#A7B3C6] font-medium mt-0.5">
              Source: Payruns + Payslips + Payrun Warnings
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#8B5CF6] bg-[#8B5CF6]/15 px-2 py-0.5 rounded-[4px]">
            {total} Payslips Total
          </span>
        </div>

        {/* Stacked Status Progress Bar */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-[12px] font-semibold">
            <span className="text-[#F8FAFC]">Status Split</span>
            <span className="text-[#A7B3C6] font-normal">{total} Records</span>
          </div>

          <div className="w-full bg-[#172033] h-3.5 rounded-full flex overflow-hidden border border-[#263449]/80">
            {paid > 0 && (
              <div
                className="bg-[#22C55E] h-full transition-all duration-500"
                style={{ width: `${paidPct}%` }}
                title={`Paid: ${paid}`}
              ></div>
            )}
            {pending > 0 && (
              <div
                className="bg-[#F59E0B] h-full transition-all duration-500"
                style={{ width: `${pendingPct}%` }}
                title={`Pending: ${pending}`}
              ></div>
            )}
            {cancelled > 0 && (
              <div
                className="bg-[#EF4444] h-full transition-all duration-500"
                style={{ width: `${cancelledPct}%` }}
                title={`Cancelled: ${cancelled}`}
              ></div>
            )}
          </div>

          {/* Status Breakdown Chips */}
          <div className="flex items-center justify-between text-[11px] text-[#A7B3C6] pt-1">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
              <span>Paid: <strong className="text-[#F8FAFC]">{paid}</strong></span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
              <span>Pending: <strong className="text-[#F8FAFC]">{pending}</strong> (Draft: {draft}, Computed: {computed})</span>
            </div>
            {cancelled > 0 && (
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
                <span>Cancelled: <strong className="text-[#F8FAFC]">{cancelled}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Real Payroll Alerts Component */}
        <PayrollAlerts alerts={alerts} />
      </div>

      <div className="mt-4 pt-3 border-t border-[#263449]/40 flex items-center justify-between text-[11px] text-[#A7B3C6]">
        <span>Validated: <strong className="text-[#F8FAFC]">{validated}</strong></span>
        <span>With Warnings: <strong className="text-[#F59E0B]">{payslipStatus.withWarnings}</strong></span>
      </div>
    </div>
  );
}

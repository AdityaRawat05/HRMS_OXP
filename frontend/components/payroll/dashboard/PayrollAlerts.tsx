"use client";

import React from "react";
import { PayrollDashboardData } from "../../../lib/api";

interface PayrollAlertsProps {
  alerts: PayrollDashboardData["payrollAlerts"];
}

export default function PayrollAlerts({ alerts }: PayrollAlertsProps) {
  const severityClasses = {
    error: "bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444]",
    warning: "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]",
    info: "bg-[#4F8CFF]/15 border-[#4F8CFF]/30 text-[#4F8CFF]",
  };

  return (
    <div className="space-y-2 mt-4">
      <div className="text-[12px] font-semibold text-[#A7B3C6] mb-2 flex items-center justify-between">
        <span>Current Payroll Alerts</span>
        <span className="text-[11px] font-bold text-[#F8FAFC] bg-[#172033] px-2 py-0.5 rounded-[4px] border border-[#263449]">
          {alerts.length} Alerts
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-[#172033]/60 border border-[#263449] p-3 rounded-[8px] text-[12px] text-[#22C55E] flex items-center space-x-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>No critical payroll warnings or missing data alerts for this period.</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-2.5 rounded-[8px] border text-[12px] flex items-start space-x-2.5 ${
                severityClasses[alert.severity] || severityClasses.warning
              }`}
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight">{alert.message}</p>
                <span className="text-[10px] opacity-80 uppercase tracking-wider block mt-0.5 font-mono">
                  Source: {alert.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

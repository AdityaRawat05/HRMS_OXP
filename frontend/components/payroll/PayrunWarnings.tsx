"use client";

import React from "react";
import { PayrunWarningRecord } from "../../lib/api";

interface PayrunWarningsProps {
  warnings: PayrunWarningRecord[];
}

export default function PayrunWarnings({ warnings }: PayrunWarningsProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="bg-[#111827] border border-[#F59E0B]/30 rounded-[12px] p-5 mb-6 shadow-sm">
      <div className="flex items-center space-x-2.5 mb-3 text-[#F59E0B]">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="text-[14px] font-bold">
          Payrun Warnings & Alerts ({warnings.length})
        </h3>
      </div>

      <div className="space-y-2">
        {warnings.map((w) => {
          const isError = w.severity === "error";

          return (
            <div
              key={w.id}
              className={`p-3 rounded-[8px] border text-[12.5px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                isError
                  ? "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
                  : "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]"
              }`}
            >
              <div className="flex items-start space-x-2">
                <span className="font-semibold capitalize mt-0.5">•</span>
                <div>
                  <span className="font-semibold uppercase text-[10.5px] tracking-wider bg-black/20 px-1.5 py-0.5 rounded mr-1.5">
                    {w.warning_type.replace(/_/g, " ")}
                  </span>
                  <span>{w.message}</span>
                </div>
              </div>

              {w.employee_name && (
                <div className="text-[11px] opacity-80 font-mono shrink-0">
                  {w.employee_name} ({w.employee_code || "N/A"})
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

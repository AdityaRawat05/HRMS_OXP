"use client";

import React from "react";
import { PayrunWarningRecord } from "../../lib/api";

interface PayslipWarningProps {
  warnings: PayrunWarningRecord[];
}

export default function PayslipWarning({ warnings }: PayslipWarningProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="mb-6 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-[10px] p-4 shadow-sm">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-[13.5px] font-bold text-[#F59E0B]">
            Payslip Warnings ({warnings.length})
          </h4>
          <div className="mt-2 space-y-1.5 text-[12.5px] text-[#F8FAFC]">
            {warnings.map((w, idx) => (
              <div key={w.id || idx} className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                <span className="font-semibold text-[#F59E0B] uppercase text-[11px] tracking-wide">
                  [{w.warning_type.replace(/_/g, " ")}]:
                </span>
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

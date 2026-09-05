"use client";

import React, { useState } from "react";
import {
  computeSinglePayslipApi,
  markSinglePayslipPaidApi,
  getPayslipPdfUrl,
} from "../../lib/api";

interface PayslipActionsProps {
  payslipId: string;
  state: string;
  payrunState?: string;
  onRefresh: () => void;
}

export default function PayslipActions({
  payslipId,
  state,
  payrunState,
  onRefresh,
}: PayslipActionsProps) {
  const [computing, setComputing] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCompute = state === "draft" || state === "computed";
  const canMarkPaid = state !== "paid" && state !== "cancelled" && (payrunState === "validated" || payrunState === "paid");

  const handleCompute = async () => {
    if (!canCompute) return;
    setComputing(true);
    setError(null);
    try {
      const res = await computeSinglePayslipApi(payslipId);
      if (!res.success) {
        setError(res.error || "Failed to compute payslip.");
      } else {
        onRefresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during computation.");
    } finally {
      setComputing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!canMarkPaid) return;
    setMarkingPaid(true);
    setError(null);
    try {
      const res = await markSinglePayslipPaidApi(payslipId);
      if (!res.success) {
        setError(res.error || "Failed to mark payslip as paid.");
      } else {
        onRefresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handlePrintPdf = () => {
    const pdfUrl = getPayslipPdfUrl(payslipId);
    window.open(pdfUrl, "_blank");
  };

  return (
    <div className="mb-6 bg-[#111827] border border-[#263449] rounded-[12px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="text-[12.5px] text-[#A7B3C6]">
        Status:{" "}
        <span className="font-bold text-[#F8FAFC] uppercase tracking-wide">
          {state}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {/* COMPUTE */}
        <button
          type="button"
          onClick={handleCompute}
          disabled={computing || !canCompute}
          className="h-9 px-4 rounded-[6px] bg-[#4F8CFF] hover:bg-[#3B78E7] text-white text-[12px] font-bold tracking-wider uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center space-x-1.5"
        >
          {computing ? (
            <span>Computing...</span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>COMPUTE</span>
            </>
          )}
        </button>

        {/* MARK PAID */}
        <button
          type="button"
          onClick={handleMarkPaid}
          disabled={markingPaid || !canMarkPaid}
          className="h-9 px-4 rounded-[6px] bg-[#22C55E] hover:bg-[#16A34A] text-white text-[12px] font-bold tracking-wider uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center space-x-1.5"
        >
          {markingPaid ? (
            <span>Processing...</span>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>MARK PAID</span>
            </>
          )}
        </button>

        {/* PRINT PAYSLIP */}
        <button
          type="button"
          onClick={handlePrintPdf}
          className="h-9 px-4 rounded-[6px] bg-[#172033] hover:bg-[#172033]/80 border border-[#263449] text-[#F8FAFC] text-[12px] font-bold tracking-wider uppercase transition-colors shadow-sm flex items-center space-x-1.5"
        >
          <svg className="w-4 h-4 text-[#4F8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>PRINT PAYSLIP</span>
        </button>
      </div>

      {/* Error alert if action fails */}
      {error && (
        <div className="w-full mt-2 text-[12px] text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 p-2.5 rounded-[6px]">
          {error}
        </div>
      )}
    </div>
  );
}

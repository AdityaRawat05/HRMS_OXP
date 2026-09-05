"use client";

import React, { useState } from "react";
import {
  computePayrunApi,
  validatePayrunApi,
  markPayrunPaidApi,
  sendPayslipsApi,
} from "../../lib/api";

interface PayrunActionsProps {
  payrunId: number;
  state: "draft" | "computed" | "validated" | "paid" | "sent" | "cancelled";
  onActionCompleted: () => void;
  disabled?: boolean;
}

export default function PayrunActions({
  payrunId,
  state,
  onActionCompleted,
  disabled = false,
}: PayrunActionsProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const canCompute = state === "draft" || state === "computed";
  const canValidate = state === "computed";
  const canMarkPaid = state === "validated";
  const canSendPayslips = state === "paid" || state === "validated";

  const handleCompute = async () => {
    if (!canCompute || activeAction) return;
    setActiveAction("compute");
    setActionError(null);
    setActionMessage(null);

    try {
      const res = await computePayrunApi(payrunId);
      if (!res.success) {
        setActionError(res.error || "Failed to compute payroll.");
      } else {
        setActionMessage("Payroll computed successfully!");
        onActionCompleted();
      }
    } catch (err: any) {
      setActionError(err.message || "Error computing payroll.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleValidate = async () => {
    if (!canValidate || activeAction) return;
    setActiveAction("validate");
    setActionError(null);
    setActionMessage(null);

    try {
      const res = await validatePayrunApi(payrunId);
      if (!res.success) {
        setActionError(res.error || "Failed to validate payrun.");
      } else {
        setActionMessage("Payrun validated successfully!");
        onActionCompleted();
      }
    } catch (err: any) {
      setActionError(err.message || "Error validating payrun.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleMarkPaid = async () => {
    if (!canMarkPaid || activeAction) return;
    if (!window.confirm("Are you sure you want to mark this payrun as PAID?")) {
      return;
    }

    setActiveAction("mark-paid");
    setActionError(null);
    setActionMessage(null);

    try {
      const res = await markPayrunPaidApi(payrunId);
      if (!res.success) {
        setActionError(res.error || "Failed to mark payrun as paid.");
      } else {
        setActionMessage("Payrun marked as paid successfully!");
        onActionCompleted();
      }
    } catch (err: any) {
      setActionError(err.message || "Error marking payrun as paid.");
    } finally {
      setActiveAction(null);
    }
  };

  const handleSendPayslips = async () => {
    if (!canSendPayslips || activeAction) return;
    setActiveAction("send-payslips");
    setActionError(null);
    setActionMessage(null);

    try {
      const res = await sendPayslipsApi(payrunId);
      if (!res.success) {
        setActionError(res.error || "Failed to send payslips.");
      } else {
        setActionMessage(res.data?.message || "Payslips processed successfully.");
        onActionCompleted();
      }
    } catch (err: any) {
      setActionError(err.message || "Error sending payslips.");
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="mb-6">
      {/* Feedback Messages */}
      {actionError && (
        <div className="mb-4 p-3.5 rounded-[8px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[12.5px] leading-relaxed flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-[11px] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {actionMessage && (
        <div className="mb-4 p-3.5 rounded-[8px] bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-[12.5px] leading-relaxed flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-[11px] hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Buttons Bar */}
      <div className="bg-[#111827] border border-[#263449] rounded-[10px] p-3.5 flex flex-wrap items-center gap-3 shadow-sm">
        {/* COMPUTE */}
        <button
          type="button"
          onClick={handleCompute}
          disabled={!canCompute || disabled || activeAction !== null}
          className={`h-9 px-4 rounded-[6px] text-[12px] font-bold tracking-wider uppercase transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
            canCompute
              ? "bg-[#4F8CFF] hover:bg-[#3B78E7] text-white"
              : "bg-[#172033] text-[#718096] border border-[#263449]"
          }`}
        >
          {activeAction === "compute" ? (
            <span>Computing...</span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Compute</span>
            </>
          )}
        </button>

        {/* VALIDATE */}
        <button
          type="button"
          onClick={handleValidate}
          disabled={!canValidate || disabled || activeAction !== null}
          className={`h-9 px-4 rounded-[6px] text-[12px] font-bold tracking-wider uppercase transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
            canValidate
              ? "bg-[#2DD4BF] hover:bg-[#14B8A6] text-[#0B1220]"
              : "bg-[#172033] text-[#718096] border border-[#263449]"
          }`}
        >
          {activeAction === "validate" ? (
            <span>Validating...</span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Validate</span>
            </>
          )}
        </button>

        {/* MARK PAID */}
        <button
          type="button"
          onClick={handleMarkPaid}
          disabled={!canMarkPaid || disabled || activeAction !== null}
          className={`h-9 px-4 rounded-[6px] text-[12px] font-bold tracking-wider uppercase transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
            canMarkPaid
              ? "bg-[#22C55E] hover:bg-[#16A34A] text-white"
              : "bg-[#172033] text-[#718096] border border-[#263449]"
          }`}
        >
          {activeAction === "mark-paid" ? (
            <span>Marking Paid...</span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Mark Paid</span>
            </>
          )}
        </button>

        {/* SEND PAYSLIPS */}
        <button
          type="button"
          onClick={handleSendPayslips}
          disabled={!canSendPayslips || disabled || activeAction !== null}
          className={`h-9 px-4 rounded-[6px] text-[12px] font-bold tracking-wider uppercase transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
            canSendPayslips
              ? "bg-[#A855F7] hover:bg-[#9333EA] text-white"
              : "bg-[#172033] text-[#718096] border border-[#263449]"
          }`}
        >
          {activeAction === "send-payslips" ? (
            <span>Sending...</span>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Send Payslips</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

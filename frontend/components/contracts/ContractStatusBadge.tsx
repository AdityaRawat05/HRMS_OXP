"use client";

import React from "react";

interface ContractStatusBadgeProps {
  status?: string;
  state?: string;
}

export default function ContractStatusBadge({ status, state }: ContractStatusBadgeProps) {
  const currentState = (state || status || "active").toLowerCase();

  let isRunning = currentState === "active" || currentState === "running";
  let isExpired = currentState === "expired";
  let isCancelled = currentState === "cancelled";
  let isDraft = currentState === "draft";

  if (isRunning) {
    return (
      <span className="inline-flex items-center space-x-1.5 bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"></span>
        <span>Running</span>
      </span>
    );
  }

  if (isExpired) {
    return (
      <span className="inline-flex items-center space-x-1.5 bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
        <span>Expired</span>
      </span>
    );
  }

  if (isCancelled) {
    return (
      <span className="inline-flex items-center space-x-1.5 bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
        <span>Cancelled</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center space-x-1.5 bg-[#64748B]/15 text-[#94A3B8] border border-[#64748B]/30 px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]"></span>
      <span>Draft</span>
    </span>
  );
}

"use client";

import React from "react";

interface AttendanceNotesProps {
  notes?: string | null;
  reason?: string | null;
  source?: string;
  isManuallyCorrected?: boolean;
}

export default function AttendanceNotes({
  notes,
  reason,
  source,
  isManuallyCorrected,
}: AttendanceNotesProps) {
  const noteText = notes || reason || (
    isManuallyCorrected
      ? "Manually corrected by an authorized user."
      : "System-generated from check in/out or manually corrected by an authorized user."
  );

  return (
    <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 space-y-2">
      <div className="flex items-center space-x-2 text-[#A7B3C6] text-[13px] font-semibold">
        <svg className="w-4 h-4 text-[#4F8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span>Notes</span>
      </div>
      <p className="text-[13px] text-[#94A3B8] leading-relaxed">
        {noteText}
      </p>
      {source && (
        <span className="inline-block text-[11px] text-[#64748B] font-mono mt-1">
          Source: {source}
        </span>
      )}
    </div>
  );
}

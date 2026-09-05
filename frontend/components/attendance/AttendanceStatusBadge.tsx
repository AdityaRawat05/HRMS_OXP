"use client";

import React from "react";

interface AttendanceStatusBadgeProps {
  status: string;
  statusDisplay?: string;
  isLate?: boolean;
}

export default function AttendanceStatusBadge({
  status,
  statusDisplay,
  isLate,
}: AttendanceStatusBadgeProps) {
  const lowerStatus = (status || "").toLowerCase();

  let dotColor = "bg-[#22C55E]";
  let textColor = "text-[#22C55E]";
  let label = statusDisplay || "Present";

  if (lowerStatus === "absent") {
    dotColor = "bg-[#EF4444]";
    textColor = "text-[#EF4444]";
    label = statusDisplay || "Absent";
  } else if (lowerStatus === "late" || isLate) {
    dotColor = "bg-[#F59E0B]";
    textColor = "text-[#F59E0B]";
    label = statusDisplay || "Late";
  } else if (lowerStatus === "half_day") {
    dotColor = "bg-[#3B82F6]";
    textColor = "text-[#3B82F6]";
    label = statusDisplay || "Half Day";
  } else if (lowerStatus === "on_leave" || lowerStatus === "holiday") {
    dotColor = "bg-[#8B5CF6]";
    textColor = "text-[#8B5CF6]";
    label = statusDisplay || "On Leave";
  } else if (lowerStatus === "missing_checkout") {
    dotColor = "bg-[#F97316]";
    textColor = "text-[#F97316]";
    label = statusDisplay || "Missing Checkout";
  }

  return (
    <div className="inline-flex items-center space-x-1.5 shrink-0 px-2.5 py-0.5 rounded-[6px] bg-[#172033] border border-[#263449]">
      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
      <span className={`text-[12px] font-medium ${textColor}`}>
        {label}
      </span>
    </div>
  );
}

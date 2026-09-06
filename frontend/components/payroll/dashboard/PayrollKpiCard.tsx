"use client";

import React from "react";

interface PayrollKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: { text: string; color: "green" | "orange" | "blue" | "purple" };
  icon?: React.ReactNode;
}

export default function PayrollKpiCard({
  title,
  value,
  subtitle,
  badge,
  icon,
}: PayrollKpiCardProps) {
  const badgeColorClasses = {
    green: "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30",
    orange: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30",
    blue: "bg-[#4F8CFF]/15 text-[#4F8CFF] border-[#4F8CFF]/30",
    purple: "bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30",
  };

  return (
    <div className="bg-[#111827] border border-[#263449] p-4.5 rounded-[12px] shadow-sm hover:border-[#4F8CFF]/40 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold text-[#A7B3C6]">
            {title}
          </span>
          {icon && <div className="text-[#A7B3C6] opacity-80">{icon}</div>}
        </div>
        <div className="text-[22px] font-extrabold text-[#F8FAFC] tracking-tight">
          {value}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#263449]/40">
        {subtitle && (
          <span className="text-[11.5px] text-[#A7B3C6] font-medium truncate">
            {subtitle}
          </span>
        )}
        {badge && (
          <span
            className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-[5px] border ${
              badgeColorClasses[badge.color] || badgeColorClasses.blue
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}

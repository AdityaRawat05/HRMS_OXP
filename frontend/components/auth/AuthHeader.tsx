import React from "react";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="mb-6 text-left">
      {/* Brand Logo & Platform Subtitle */}
      <div className="mb-5 flex flex-col items-start">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#4F8CFF]"></div>
          <span className="text-[18px] font-bold text-[#F8FAFC] tracking-wider uppercase">
            PEOPLEPAY360
          </span>
        </div>
        <span className="text-[11px] font-medium text-[#718096] mt-0.5 tracking-wide">
          HR & Payroll Operations Platform
        </span>
      </div>

      {/* Page Title & Subtitle */}
      <h1 className="text-[24px] font-bold text-[#F8FAFC] tracking-tight leading-snug">
        {title}
      </h1>
      <p className="text-[13px] text-[#A7B3C6] mt-1 leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

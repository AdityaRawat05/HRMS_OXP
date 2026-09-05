import React from "react";

interface AuthErrorProps {
  message: string | null;
  type?: "error" | "success" | "info";
}

export default function AuthError({ message, type = "error" }: AuthErrorProps) {
  if (!message) return null;

  if (type === "success") {
    return (
      <div className="mb-4 p-3 rounded-[8px] bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-[12.5px] leading-relaxed flex items-start space-x-2">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{message}</span>
      </div>
    );
  }

  if (type === "info") {
    return (
      <div className="mb-4 p-3 rounded-[8px] bg-[#4F8CFF]/10 border border-[#4F8CFF]/30 text-[#4F8CFF] text-[12.5px] leading-relaxed flex items-start space-x-2">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="mb-4 p-3 rounded-[8px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[12.5px] leading-relaxed flex items-start space-x-2">
      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
}

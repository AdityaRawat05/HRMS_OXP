import React from "react";

interface AuthCardProps {
  children: React.ReactNode;
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[440px] bg-[#111827] border border-[#263449] rounded-[14px] p-7 sm:p-8 flex flex-col shadow-lg">
      {children}
    </div>
  );
}

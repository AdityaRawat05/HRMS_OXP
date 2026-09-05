"use client";

import React, { useState } from "react";

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "••••••••••",
  autoComplete = "current-password",
  required = true,
  disabled = false,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        className="w-full h-10 px-3.5 pr-10 text-[13.5px] text-[#F8FAFC] bg-[#0F172A] border border-[#263449] rounded-[8px] placeholder-[#64748B] focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        aria-label={showPassword ? "Hide password" : "Show password"}
        className="absolute right-3 top-2.5 text-[#718096] hover:text-[#A7B3C6] transition-colors focus:outline-none disabled:opacity-40"
      >
        {showPassword ? (
          // Eye Slash Icon
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
            />
          </svg>
        ) : (
          // Eye Icon
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

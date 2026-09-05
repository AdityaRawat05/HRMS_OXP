"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PayrollNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "HR", href: "/users" },
    { label: "Employees ▼", href: "/users", dropdown: true },
    { label: "Contracts ▼", href: "/users", dropdown: true },
    { label: "Attendance", href: "/users" },
    { label: "Time Off ▼", href: "/users", dropdown: true },
    { label: "Payroll", href: "/payroll/payruns", active: true },
  ];

  return (
    <header className="bg-[#111827] border-b border-[#263449] sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand & App Title */}
        <div className="flex items-center space-x-6">
          <Link href="/payroll/payruns" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-tr from-[#4F8CFF] to-[#2DD4BF] flex items-center justify-center text-white font-bold text-[15px] shadow-sm">
              P
            </div>
            <span className="text-[15px] font-bold text-[#F8FAFC] tracking-tight">
              PeoplePay<span className="text-[#4F8CFF]">360</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#263449]">
            {navItems.map((item, idx) => {
              const isPayroll = item.label === "Payroll";
              const isActive = isPayroll || pathname?.startsWith(item.href);

              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-[6px] text-[12.5px] font-medium transition-colors flex items-center space-x-1 ${
                    isPayroll
                      ? "bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30 font-semibold"
                      : isActive
                      ? "text-[#F8FAFC] bg-[#172033]"
                      : "text-[#A7B3C6] hover:text-[#F8FAFC] hover:bg-[#172033]/60"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Badge & Module Switcher */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-[#172033] border border-[#263449] px-2.5 py-1 rounded-[6px]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
            <span className="text-[11.5px] text-[#A7B3C6] font-medium">Payroll Engine Active</span>
          </div>
          <Link
            href="/users"
            className="text-[11.5px] text-[#A7B3C6] hover:text-[#F8FAFC] bg-[#0F172A] border border-[#263449] px-2.5 py-1 rounded-[6px] transition-colors"
          >
            User Admin
          </Link>
        </div>
      </div>

      {/* Sub Navigation Bar for Payroll Module */}
      <div className="bg-[#0F172A] border-t border-b border-[#263449]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-10 flex items-center space-x-6 text-[12.5px]">
          <Link
            href="/payroll/payruns"
            className={`h-full flex items-center font-semibold border-b-2 transition-colors ${
              pathname?.startsWith("/payroll/payruns")
                ? "border-[#4F8CFF] text-[#4F8CFF]"
                : "border-transparent text-[#A7B3C6] hover:text-[#F8FAFC]"
            }`}
          >
            Payruns
          </Link>
          <Link
            href="/payroll/payslips"
            className={`h-full flex items-center font-semibold border-b-2 transition-colors ${
              pathname?.startsWith("/payroll/payslips")
                ? "border-[#4F8CFF] text-[#4F8CFF]"
                : "border-transparent text-[#A7B3C6] hover:text-[#F8FAFC]"
            }`}
          >
            Payslips
          </Link>
        </div>
      </div>
    </header>
  );
}

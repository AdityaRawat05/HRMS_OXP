"use client";

import React from "react";
import { PayrollDashboardData } from "../../../lib/api";

interface PayrollDashboardFiltersProps {
  filters: PayrollDashboardData["filters"];
  selectedPeriod: string | number;
  selectedDept: string | number;
  selectedEmpType: string;
  selectedCompany: string | number;
  onPeriodChange: (val: string) => void;
  onDeptChange: (val: string) => void;
  onEmpTypeChange: (val: string) => void;
  onCompanyChange: (val: string) => void;
  loading: boolean;
}

export default function PayrollDashboardFilters({
  filters,
  selectedPeriod,
  selectedDept,
  selectedEmpType,
  selectedCompany,
  onPeriodChange,
  onDeptChange,
  onEmpTypeChange,
  onCompanyChange,
  loading,
}: PayrollDashboardFiltersProps) {
  const { periodOptions, departmentOptions, employeeTypeOptions, companyOptions } = filters;

  return (
    <div className="bg-[#111827] border border-[#263449] p-4 rounded-[12px] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Dropdown Filters Group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
        {/* Period Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#A7B3C6] uppercase tracking-wider mb-1">
            Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => onPeriodChange(e.target.value)}
            disabled={loading}
            className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-1.5 outline-none transition-colors disabled:opacity-50 cursor-pointer"
          >
            {periodOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.state.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#A7B3C6] uppercase tracking-wider mb-1">
            Department
          </label>
          <select
            value={selectedDept}
            onChange={(e) => onDeptChange(e.target.value)}
            disabled={loading}
            className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-1.5 outline-none transition-colors disabled:opacity-50 cursor-pointer"
          >
            {departmentOptions.map((d) => (
              <option key={String(d.id)} value={String(d.id)}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Employee Type Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#A7B3C6] uppercase tracking-wider mb-1">
            Employee Type
          </label>
          <select
            value={selectedEmpType}
            onChange={(e) => onEmpTypeChange(e.target.value)}
            disabled={loading}
            className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-1.5 outline-none transition-colors disabled:opacity-50 cursor-pointer"
          >
            {employeeTypeOptions.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </select>
        </div>

        {/* Company Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-[#A7B3C6] uppercase tracking-wider mb-1">
            Company
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => onCompanyChange(e.target.value)}
            disabled={loading}
            className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-1.5 outline-none transition-colors disabled:opacity-50 cursor-pointer"
          >
            {companyOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Indicator / Reset */}
      {loading && (
        <div className="flex items-center space-x-2 text-[12px] text-[#4F8CFF] font-medium shrink-0 pt-2 md:pt-0">
          <div className="w-3.5 h-3.5 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
          <span>Updating Dashboard...</span>
        </div>
      )}
    </div>
  );
}

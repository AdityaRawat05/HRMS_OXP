"use client";

import React from "react";
import { EligibleEmployeeRecord } from "../../lib/api";

interface EmployeeSelectionTableProps {
  employees: EligibleEmployeeRecord[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  disabled?: boolean;
}

export default function EmployeeSelectionTable({
  employees,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  disabled = false,
}: EmployeeSelectionTableProps) {
  const allSelected = employees.length > 0 && selectedIds.length === employees.length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amountStr: string) => {
    const num = parseFloat(amountStr || "0");
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="bg-[#111827] border border-[#263449] rounded-[12px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[#172033] border-b border-[#263449] text-[11px] font-semibold text-[#A7B3C6] uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  disabled={disabled || employees.length === 0}
                  className="w-4 h-4 rounded border-[#263449] bg-[#0F172A] text-[#4F8CFF] focus:ring-[#4F8CFF] focus:ring-offset-0 cursor-pointer disabled:opacity-50"
                />
              </th>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Working Hours</th>
              <th className="py-3 px-4">Start Date</th>
              <th className="py-3 px-4 text-right">Wage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263449]/60 text-[12.5px]">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#718096]">
                  No eligible employees found for selection.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const isSelected = selectedIds.includes(emp.id);

                return (
                  <tr
                    key={emp.id}
                    onClick={() => !disabled && onToggleSelect(emp.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#4F8CFF]/10 hover:bg-[#4F8CFF]/15"
                        : "hover:bg-[#172033]/50"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(emp.id)}
                        disabled={disabled}
                        className="w-4 h-4 rounded border-[#263449] bg-[#0F172A] text-[#4F8CFF] focus:ring-[#4F8CFF] focus:ring-offset-0 cursor-pointer disabled:opacity-50"
                      />
                    </td>

                    {/* Employee Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#172033] border border-[#263449] flex items-center justify-center text-[12px] font-bold text-[#4F8CFF]">
                          {emp.first_name?.[0]}
                          {emp.last_name?.[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-[#F8FAFC]">
                            {emp.name}
                          </div>
                          <div className="text-[11px] text-[#A7B3C6] font-mono">
                            {emp.employee_code} • {emp.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Working Hours */}
                    <td className="py-3.5 px-4 text-[#A7B3C6] font-medium">
                      {emp.working_hours} hrs/wk
                    </td>

                    {/* Start Date */}
                    <td className="py-3.5 px-4 text-[#A7B3C6] font-medium">
                      {formatDate(emp.hire_date)}
                    </td>

                    {/* Wage */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-[#2DD4BF]">
                        {formatCurrency(emp.wage_amount)}
                      </span>
                      <span className="text-[10.5px] text-[#718096] block capitalize">
                        per {emp.wage_type || "month"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

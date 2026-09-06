"use client";

import React from "react";
import { PayrollDashboardData } from "../../../lib/api";

interface DepartmentOverviewProps {
  departments: PayrollDashboardData["departmentOverview"];
}

export default function DepartmentOverview({ departments }: DepartmentOverviewProps) {
  return (
    <div className="bg-[#111827] border border-[#263449] p-5 rounded-[12px] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between pb-3 border-b border-[#263449]/60 mb-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#F8FAFC]">
              Department Overview
            </h3>
            <p className="text-[11.5px] text-[#A7B3C6] font-medium mt-0.5">
              Source: Employees + Contracts + Payslips
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#8B5CF6] bg-[#8B5CF6]/15 px-2 py-0.5 rounded-[4px]">
            Staffing Impact
          </span>
        </div>

        {/* Table View */}
        {departments.length === 0 ? (
          <div className="py-8 text-center text-[#A7B3C6] text-[13px]">
            No department data available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#263449] text-[#A7B3C6] font-semibold">
                  <th className="pb-2">Department</th>
                  <th className="pb-2 text-center">Headcount</th>
                  <th className="pb-2 text-right">Monthly Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263449]/40 text-[#F8FAFC]">
                {departments.map((dept) => (
                  <tr key={dept.departmentId} className="hover:bg-[#172033]/50 transition-colors">
                    <td className="py-2.5 font-medium flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
                      <span className="truncate max-w-[120px]">{dept.departmentName}</span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-[#4F8CFF]">
                      {dept.headcount}
                    </td>
                    <td className="py-2.5 text-right font-bold text-[#F8FAFC]">
                      ₹{dept.monthlySalary.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#263449]/40 flex items-center justify-between text-[11px] text-[#A7B3C6]">
        <span>Total Headcount: <strong className="text-[#4F8CFF]">{departments.reduce((acc, d) => acc + d.headcount, 0)}</strong></span>
        <span>Monthly Total: <strong className="text-[#F8FAFC]">₹{departments.reduce((acc, d) => acc + d.monthlySalary, 0).toLocaleString("en-IN")}</strong></span>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { PayrollDashboardData } from "../../../lib/api";

interface SalaryByDepartmentChartProps {
  data: PayrollDashboardData["salaryByDepartment"];
}

export default function SalaryByDepartmentChart({ data }: SalaryByDepartmentChartProps) {
  const maxSalary = Math.max(...data.map((d) => d.salaryCost), 1);

  return (
    <div className="bg-[#111827] border border-[#263449] p-5 rounded-[12px] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between pb-3 border-b border-[#263449]/60 mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#F8FAFC]">
              Salary Cost by Department
            </h3>
            <p className="text-[11.5px] text-[#A7B3C6] font-medium mt-0.5">
              Source: Payslips + Employee + Department
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#4F8CFF] bg-[#4F8CFF]/15 px-2 py-0.5 rounded-[4px]">
            {data.length} Departments
          </span>
        </div>

        {/* Bar Visualizer List */}
        {data.length === 0 ? (
          <div className="py-8 text-center text-[#A7B3C6] text-[13px]">
            No department salary data available.
          </div>
        ) : (
          <div className="space-y-3.5">
            {data.map((dept) => {
              const percentage = Math.min(100, Math.max(8, (dept.salaryCost / maxSalary) * 100));
              const formattedCost = `₹${dept.salaryCost.toLocaleString("en-IN")}`;

              return (
                <div key={dept.departmentId} className="group">
                  <div className="flex items-center justify-between text-[12.5px] font-medium mb-1">
                    <span className="text-[#F8FAFC] group-hover:text-[#4F8CFF] transition-colors truncate max-w-[140px]">
                      {dept.departmentName}
                    </span>
                    <div className="flex items-center space-x-2 text-[12px]">
                      <span className="text-[#A7B3C6] font-normal">
                        ({dept.employeeCount} staff)
                      </span>
                      <span className="font-bold text-[#F8FAFC]">
                        {formattedCost}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-[#172033] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#4F8CFF] to-[#8B5CF6] h-full rounded-full transition-all duration-500 group-hover:from-[#3B82F6] group-hover:to-[#7C3AED]"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#263449]/40 flex items-center justify-between text-[11px] text-[#A7B3C6]">
        <span>Aggregated per active department</span>
        <span className="font-semibold text-[#F8FAFC]">Total: ₹{data.reduce((acc, d) => acc + d.salaryCost, 0).toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { PayrollDashboardData } from "../../../lib/api";

interface MonthlyNetSalaryChartProps {
  data: PayrollDashboardData["monthlyNetSalaryTrend"];
}

export default function MonthlyNetSalaryChart({ data }: MonthlyNetSalaryChartProps) {
  const maxNet = Math.max(...data.map((d) => d.netSalary), 1);

  return (
    <div className="bg-[#111827] border border-[#263449] p-5 rounded-[12px] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between pb-3 border-b border-[#263449]/60 mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#F8FAFC]">
              Monthly Net Salary Trend
            </h3>
            <p className="text-[11.5px] text-[#A7B3C6] font-medium mt-0.5">
              Source: Historical Payslips / Payruns
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#2DD4BF] bg-[#2DD4BF]/15 px-2 py-0.5 rounded-[4px]">
            Historical Trend
          </span>
        </div>

        {/* Trend Bar / Point Graph Representation */}
        {data.length === 0 ? (
          <div className="py-8 text-center text-[#A7B3C6] text-[13px]">
            No historical trend data available.
          </div>
        ) : (
          <div className="space-y-3.5 pt-1">
            {data.map((item, idx) => {
              const heightPct = Math.min(100, Math.max(12, (item.netSalary / maxNet) * 100));
              const formattedNet = `₹${item.netSalary.toLocaleString("en-IN")}`;

              return (
                <div key={idx} className="flex items-center space-x-3 group">
                  <span className="w-20 text-[12px] font-medium text-[#A7B3C6] truncate">
                    {item.month}
                  </span>
                  <div className="flex-1 bg-[#172033] h-2.5 rounded-full overflow-hidden relative">
                    <div
                      className="bg-gradient-to-r from-[#2DD4BF] to-[#4F8CFF] h-full rounded-full transition-all duration-500 group-hover:from-[#14B8A6] group-hover:to-[#3B82F6]"
                      style={{ width: `${heightPct}%` }}
                    ></div>
                  </div>
                  <span className="w-24 text-right text-[12.5px] font-bold text-[#F8FAFC]">
                    {formattedNet}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#263449]/40 flex items-center justify-between text-[11px] text-[#A7B3C6]">
        <span>Last 6 payroll periods</span>
        <span className="font-semibold text-[#2DD4BF]">
          Avg: ₹{Math.round((data.reduce((acc, d) => acc + d.netSalary, 0) / (data.length || 1))).toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
}

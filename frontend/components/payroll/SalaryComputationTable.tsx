"use client";

import React from "react";
import { PayslipLineRecord } from "../../lib/api";

interface SalaryComputationTableProps {
  lines: PayslipLineRecord[];
  netSalary: string;
}

export default function SalaryComputationTable({
  lines,
  netSalary,
}: SalaryComputationTableProps) {
  const formatCurrency = (val: string) => {
    const num = parseFloat(val || "0");
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="bg-[#111827] border border-[#263449] rounded-[12px] overflow-hidden shadow-sm">
      <div className="p-4 bg-[#172033] border-b border-[#263449] flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-[#F8FAFC]">
            Salary Computation
          </h3>
          <p className="text-[11.5px] text-[#A7B3C6]">
            Breakdown of active salary rules and calculated lines
          </p>
        </div>

        {/* Net Salary Highlight Badge */}
        <div className="bg-[#2DD4BF]/15 border border-[#2DD4BF]/40 px-3 py-1.5 rounded-[8px] text-right">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#2DD4BF]">
            Net Payable
          </div>
          <div className="text-[15px] font-bold font-mono text-[#2DD4BF]">
            {formatCurrency(netSalary)}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-[#0F172A] border-b border-[#263449] text-[11px] font-semibold text-[#A7B3C6] uppercase tracking-wider">
              <th className="py-3 px-4">Rule</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 font-mono">Code</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263449]/60 text-[12.5px]">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#718096]">
                  No salary computation lines available. Click Compute to generate.
                </td>
              </tr>
            ) : (
              lines.map((line) => {
                const isNet = line.code === "NET";
                const isGross = line.code === "GROSS";
                const isDeduction = line.category_code === "DED" || line.code === "PF" || line.code === "PT";

                return (
                  <tr
                    key={line.id}
                    className={`transition-colors ${
                      isNet
                        ? "bg-[#2DD4BF]/10 font-bold"
                        : isGross
                        ? "bg-[#4F8CFF]/10 font-semibold"
                        : "hover:bg-[#172033]/40"
                    }`}
                  >
                    {/* Rule Name */}
                    <td className="py-3 px-4">
                      <span className={isNet ? "text-[#2DD4BF]" : isGross ? "text-[#4F8CFF]" : "text-[#F8FAFC]"}>
                        {line.name}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-[#A7B3C6]">
                      {line.category_name || line.category_code}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono">
                      <span
                        className={
                          isNet
                            ? "text-[#2DD4BF] text-[14px]"
                            : isDeduction
                            ? "text-[#EF4444]"
                            : "text-[#F8FAFC]"
                        }
                      >
                        {formatCurrency(line.amount)}
                      </span>
                    </td>

                    {/* Code */}
                    <td className="py-3 px-4 font-mono text-[11.5px] text-[#A7B3C6]">
                      {line.code}
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

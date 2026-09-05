"use client";

import React from "react";
import Link from "next/link";
import { ContractRecord } from "../../lib/api";
import ContractStatusBadge from "./ContractStatusBadge";

interface ContractTableProps {
  contracts: ContractRecord[];
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  } catch {
    return dateStr;
  }
}

function formatWage(wageStr?: string | number | null): string {
  if (wageStr === undefined || wageStr === null || wageStr === "") return "₹0";
  const num = typeof wageStr === "number" ? wageStr : parseFloat(String(wageStr));
  if (isNaN(num)) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function ContractTable({ contracts }: ContractTableProps) {
  return (
    <div className="w-full bg-[#111827] border border-[#263449] rounded-[12px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-[#0F172A] border-b border-[#263449] text-[#94A3B8] font-semibold">
              <th className="py-3 px-4 sm:px-6">Contract</th>
              <th className="py-3 px-4 sm:px-6">Employee</th>
              <th className="py-3 px-4 sm:px-6">Start</th>
              <th className="py-3 px-4 sm:px-6">End</th>
              <th className="py-3 px-4 sm:px-6">Wage / Month</th>
              <th className="py-3 px-4 sm:px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#263449]/60 text-[#F8FAFC]">
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                className="hover:bg-[#172033]/80 transition-colors group cursor-pointer"
              >
                {/* Contract Reference */}
                <td className="py-3.5 px-4 sm:px-6 font-mono text-[12.5px] font-semibold text-[#4F8CFF]">
                  <Link
                    href={`/employees/contracts/${contract.id}`}
                    className="group-hover:underline block"
                  >
                    {contract.reference || contract.contract_reference}
                  </Link>
                </td>

                {/* Employee Name */}
                <td className="py-3.5 px-4 sm:px-6 font-medium text-[#F8FAFC]">
                  <Link
                    href={`/employees/contracts/${contract.id}`}
                    className="block"
                  >
                    {contract.employee?.name || "Unassigned"}
                  </Link>
                </td>

                {/* Start Date */}
                <td className="py-3.5 px-4 sm:px-6 text-[#A7B3C6]">
                  {formatDate(contract.date_start)}
                </td>

                {/* End Date */}
                <td className="py-3.5 px-4 sm:px-6 text-[#A7B3C6]">
                  {formatDate(contract.date_end)}
                </td>

                {/* Wage / Month */}
                <td className="py-3.5 px-4 sm:px-6 font-medium text-[#F8FAFC]">
                  {formatWage(contract.wage_amount || contract.wage_per_month)}
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4 sm:px-6 text-right">
                  <ContractStatusBadge
                    status={contract.status}
                    state={contract.state}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

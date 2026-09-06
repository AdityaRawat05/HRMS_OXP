"use client";

import React from "react";
import { PayrollDashboardData } from "../../../lib/api";

interface TimeOffOverviewProps {
  timeOff: PayrollDashboardData["timeOffOverview"];
}

export default function TimeOffOverview({ timeOff }: TimeOffOverviewProps) {
  return (
    <div className="bg-[#111827] border border-[#263449] p-5 rounded-[12px] shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between pb-3 border-b border-[#263449]/60 mb-3">
          <div>
            <h3 className="text-[15px] font-bold text-[#F8FAFC]">
              Time Off Overview
            </h3>
            <p className="text-[11.5px] text-[#A7B3C6] font-medium mt-0.5">
              Source: Time Off Requests + Allocations
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#F59E0B] bg-[#F59E0B]/15 px-2 py-0.5 rounded-[4px]">
            Leave Summary
          </span>
        </div>

        {/* Table View */}
        {timeOff.length === 0 ? (
          <div className="py-8 text-center text-[#A7B3C6] text-[13px]">
            No leave records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#263449] text-[#A7B3C6] font-semibold">
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-center">Approved Days</th>
                  <th className="pb-2 text-center">Pending</th>
                  <th className="pb-2 text-right">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263449]/40 text-[#F8FAFC]">
                {timeOff.map((item) => (
                  <tr key={item.typeId} className="hover:bg-[#172033]/50 transition-colors">
                    <td className="py-2.5 font-medium flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4F8CFF]"></span>
                      <span className="truncate max-w-[110px]">{item.type}</span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-[#22C55E]">
                      {item.approvedDays}
                    </td>
                    <td className="py-2.5 text-center text-[#F59E0B] font-semibold">
                      {item.pendingCount}
                    </td>
                    <td className="py-2.5 text-right font-mono text-[#A7B3C6]">
                      {item.remainingBalance > 0 ? `${item.remainingBalance} ${item.leaveUnit}` : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#263449]/40 flex items-center justify-between text-[11px] text-[#A7B3C6]">
        <span>Types Active: <strong className="text-[#F8FAFC]">{timeOff.length}</strong></span>
        <span>Balance Source: Approved Allocations</span>
      </div>
    </div>
  );
}

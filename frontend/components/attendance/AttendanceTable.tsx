"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AttendanceStatusBadge from "./AttendanceStatusBadge";
import { AttendanceRecord } from "../../lib/api";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  selectedId?: string | null;
  onSelectRow?: (id: string) => void;
}

export default function AttendanceTable({
  records,
  selectedId,
  onSelectRow,
}: AttendanceTableProps) {
  const router = useRouter();

  const handleRowClick = (record: AttendanceRecord) => {
    if (onSelectRow) {
      onSelectRow(record.id);
    } else {
      router.push(`/attendance/${record.id}`);
    }
  };

  return (
    <div className="w-full bg-[#111827] border border-[#263449] rounded-[12px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#0F172A] border-b border-[#263449] text-[#64748B] text-[11.5px] font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 sm:px-6">Employee</th>
              <th className="py-3 px-4">Check In</th>
              <th className="py-3 px-4">Check Out</th>
              <th className="py-3 px-4 text-right">Worked Hours</th>
              <th className="py-3 px-4 sm:px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {records.map((record) => {
              const empName = record.employee_name || record.employee?.name || "Employee";
              const initials = (record.employee?.first_name || empName).charAt(0).toUpperCase();
              const checkInTime = record.check_in_time || "—";
              const checkOutTime = record.check_out_time || "—";
              const workedHoursFormatted = record.worked_hours !== null && record.worked_hours !== undefined
                ? record.worked_hours.toFixed(2)
                : record.running_worked_hours
                ? record.running_worked_hours.toFixed(2)
                : "0.00";

              const isSelected = selectedId === record.id;

              return (
                <tr
                  key={record.id}
                  onClick={() => handleRowClick(record)}
                  className={`group cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#4F8CFF]/10 border-l-2 border-l-[#4F8CFF]"
                      : "hover:bg-[#172033]/60"
                  }`}
                >
                  {/* Employee Name & Initials / Avatar */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-[12px] shrink-0">
                        {record.employee?.avatar_url ? (
                          <img
                            src={record.employee.avatar_url}
                            alt={empName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-[#F8FAFC] group-hover:text-[#4F8CFF] transition-colors block">
                          {empName}
                        </span>
                        <span className="text-[11.5px] text-[#64748B] block">
                          {record.department || "General"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Check In */}
                  <td className="py-3.5 px-4 font-mono text-[#A7B3C6] font-medium">
                    {checkInTime}
                  </td>

                  {/* Check Out */}
                  <td className="py-3.5 px-4 font-mono text-[#A7B3C6] font-medium">
                    {checkOutTime}
                  </td>

                  {/* Worked Hours */}
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#F8FAFC]">
                    {workedHoursFormatted}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <AttendanceStatusBadge
                      status={record.status}
                      statusDisplay={record.status_display}
                      isLate={record.is_late}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

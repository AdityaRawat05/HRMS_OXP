"use client";

import React from "react";
import Link from "next/link";
import { EmployeeKanbanRecord } from "../../lib/api";

interface EmployeeKanbanCardProps {
  employee: EmployeeKanbanRecord;
}

export default function EmployeeKanbanCard({ employee }: EmployeeKanbanCardProps) {
  const fullName = employee.fullName || employee.full_name || `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "Employee";
  const initials = employee.initials || "E";
  const jobPosition = employee.jobPosition || employee.job_position || "Staff Member";
  const department = employee.department || "General";
  const isActive = employee.isActive !== undefined ? employee.isActive : employee.is_active !== false;

  return (
    <Link
      href={`/users`}
      className="group block bg-[#111827] border border-[#263449] hover:border-[#4F8CFF]/60 rounded-[12px] p-5 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="flex items-start space-x-4">
        {/* Initials / Avatar Circle */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-[15px] shrink-0 shadow-sm group-hover:scale-105 transition-transform">
          {employee.avatarUrl || employee.avatar_url ? (
            <img
              src={employee.avatarUrl || employee.avatar_url || ""}
              alt={fullName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Employee Card Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="text-[15px] font-bold text-[#F8FAFC] group-hover:text-[#4F8CFF] transition-colors truncate">
              {fullName}
            </h3>
            {/* Status Dot & Label */}
            <div className="flex items-center space-x-1.5 shrink-0 pl-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? "bg-[#22C55E]" : "bg-[#64748B]"
                }`}
              ></span>
              <span
                className={`text-[12px] font-medium ${
                  isActive ? "text-[#22C55E]" : "text-[#94A3B8]"
                }`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <p className="text-[13px] text-[#A7B3C6] font-medium mt-0.5 truncate">
            {jobPosition}
          </p>

          <div className="mt-3.5 flex items-center justify-between">
            {/* Department Badge */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-medium bg-[#172033] border border-[#263449] text-[#94A3B8]">
              {department}
            </span>

            {/* Work Email / Code snippet */}
            <span className="text-[11.5px] text-[#64748B] font-mono truncate max-w-[160px]">
              {employee.employeeCode || employee.employee_code}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

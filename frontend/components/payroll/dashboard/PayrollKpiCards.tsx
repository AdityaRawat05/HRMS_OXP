"use client";

import React from "react";
import PayrollKpiCard from "./PayrollKpiCard";
import { PayrollDashboardData } from "../../../lib/api";

interface PayrollKpiCardsProps {
  kpis: PayrollDashboardData["kpis"];
}

export default function PayrollKpiCards({ kpis }: PayrollKpiCardsProps) {
  const {
    formattedNetSalaryPaid,
    payslipsGenerated,
    formattedAverageSalary,
    employeeCountForAverage,
    approvedTimeOffDays,
    pendingTimeOffCount,
    attendanceHealth,
  } = kpis;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
      {/* KPI Card 1: Total Net Salary Paid */}
      <PayrollKpiCard
        title="Total Net Salary Paid"
        value={formattedNetSalaryPaid}
        subtitle="Gross minus deductions"
        badge={{ text: "Disbursed", color: "green" }}
        icon={
          <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      {/* KPI Card 2: Payslips Generated */}
      <PayrollKpiCard
        title="Payslips Generated"
        value={payslipsGenerated.total}
        subtitle={`${payslipsGenerated.paid} paid • ${payslipsGenerated.pending} pending`}
        badge={{ text: `${payslipsGenerated.paid} Paid`, color: "blue" }}
        icon={
          <svg className="w-5 h-5 text-[#4F8CFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        }
      />

      {/* KPI Card 3: Avg Salary / Employee */}
      <PayrollKpiCard
        title="Avg Salary / Employee"
        value={formattedAverageSalary}
        subtitle={`Calculated over ${employeeCountForAverage} staff`}
        badge={{ text: "Avg", color: "purple" }}
        icon={
          <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />

      {/* KPI Card 4: Approved Time Off Days */}
      <PayrollKpiCard
        title="Approved Time Off Days"
        value={`${approvedTimeOffDays} Days`}
        subtitle={`${pendingTimeOffCount} pending approval`}
        badge={{ text: "Approved", color: "orange" }}
        icon={
          <svg className="w-5 h-5 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />

      {/* KPI Card 5: Attendance Health */}
      <PayrollKpiCard
        title="Attendance Health"
        value={`${attendanceHealth.percentage}%`}
        subtitle="Present / reviewed records"
        badge={{ text: `${attendanceHealth.presentRecords} Present`, color: "green" }}
        icon={
          <svg className="w-5 h-5 text-[#2DD4BF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
}

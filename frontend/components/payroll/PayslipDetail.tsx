"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PayslipDetailRecord, getPayslipByIdApi } from "../../lib/api";
import PayslipActions from "./PayslipActions";
import PayslipWarning from "./PayslipWarning";
import SalaryComputationTable from "./SalaryComputationTable";

interface PayslipDetailProps {
  payslipId: string;
}

export default function PayslipDetail({ payslipId }: PayslipDetailProps) {
  const [payslip, setPayslip] = useState<PayslipDetailRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPayslipByIdApi(payslipId);
      if (res.success && res.data?.payslip) {
        setPayslip(res.data.payslip);
      } else {
        setError(res.error || "Failed to load payslip details.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [payslipId]);

  useEffect(() => {
    if (payslipId) {
      fetchDetail();
    }
  }, [payslipId, fetchDetail]);

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-8 text-center animate-pulse">
          <div className="h-6 bg-[#172033] rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-[#172033] rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="mb-4 bg-[#EF4444]/10 border border-[#EF4444]/30 p-4 rounded-[10px] text-[#EF4444] text-[13px]">
          {error || "Payslip not found."}
        </div>
        <Link
          href="/payroll/payslips"
          className="inline-flex items-center space-x-1 px-4 py-2 rounded-[6px] bg-[#172033] border border-[#263449] text-[#A7B3C6] hover:text-[#F8FAFC] text-[12.5px] font-semibold transition-colors"
        >
          ← Back to Payslips
        </Link>
      </div>
    );
  }

  const formatCurrency = (val: string) => {
    const num = parseFloat(val || "0");
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      {/* Top Title & Subtitle Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[12px] text-[#A7B3C6] mb-1">
            <Link href="/payroll/payslips" className="hover:text-[#4F8CFF] transition-colors">
              Payslips
            </Link>
            <span>/</span>
            <span className="text-[#F8FAFC] font-semibold">{payslip.employee_name}</span>
            <span>/</span>
            <span className="text-[#F8FAFC] font-semibold">{payslip.period_name}</span>
          </div>
          <h1 className="text-[22px] md:text-[24px] font-bold text-[#F8FAFC] tracking-tight">
            Payslip / {payslip.employee_name} / {payslip.period_name}
          </h1>
          <p className="text-[12.5px] text-[#A7B3C6] mt-0.5">
            Detailed salary computation for one employee
          </p>
        </div>

        {/* Back Link Button */}
        <Link
          href="/payroll/payslips"
          className="text-[12.5px] font-semibold text-[#A7B3C6] hover:text-[#F8FAFC] flex items-center space-x-1.5 transition-colors bg-[#172033] px-3.5 py-1.5 rounded-[6px] border border-[#263449] shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to List</span>
        </Link>
      </div>

      {/* Action Toolbar */}
      <PayslipActions
        payslipId={payslip.id}
        state={payslip.state}
        payrunState={payslip.payrun_state}
        onRefresh={fetchDetail}
      />

      {/* Warnings Display */}
      {payslip.warnings && payslip.warnings.length > 0 && (
        <PayslipWarning warnings={payslip.warnings} />
      )}

      {/* Two-Column Information Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Card: Employee & Contract Details */}
        <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 shadow-sm">
          <div className="pb-3 mb-4 border-b border-[#263449] flex items-center justify-between">
            <h3 className="text-[13.5px] font-bold text-[#F8FAFC] uppercase tracking-wider">
              Employee Information
            </h3>
            <span className="text-[11px] font-mono text-[#A7B3C6] bg-[#0F172A] px-2 py-0.5 rounded border border-[#263449]">
              {payslip.employee_code}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-[12.5px]">
            <div>
              <span className="text-[#A7B3C6] block text-[11px] font-medium">Employee Name</span>
              <span className="font-semibold text-[#F8FAFC]">{payslip.employee_name}</span>
            </div>

            <div>
              <span className="text-[#A7B3C6] block text-[11px] font-medium">Work Email</span>
              <span className="text-[#F8FAFC]">{payslip.employee_email || "-"}</span>
            </div>

            <div>
              <span className="text-[#A7B3C6] block text-[11px] font-medium">Department</span>
              <span className="text-[#F8FAFC]">{payslip.department_name}</span>
            </div>

            <div>
              <span className="text-[#A7B3C6] block text-[11px] font-medium">Job Title</span>
              <span className="text-[#F8FAFC]">{payslip.job_title}</span>
            </div>

            <div>
              <span className="text-[#A7B3C6] block text-[11px] font-medium">Bank Account</span>
              <span className="text-[#F8FAFC] font-mono">
                {payslip.bank_account_no !== "-" ? `${payslip.bank_account_no} (${payslip.bank_name})` : "-"}
              </span>
            </div>

            <div>
              <span className="text-[#A7B3C6] block text-[11px] font-medium">PAN / UAN</span>
              <span className="text-[#F8FAFC] font-mono">
                {payslip.pan_number !== "-" ? payslip.pan_number : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Pay Period, Structure & Worked Days */}
        <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-4 border-b border-[#263449] flex items-center justify-between">
              <h3 className="text-[13.5px] font-bold text-[#F8FAFC] uppercase tracking-wider">
                Payroll Details & Attendance
              </h3>
              <span className="text-[11px] font-mono text-[#4F8CFF] bg-[#4F8CFF]/10 px-2 py-0.5 rounded border border-[#4F8CFF]/30">
                {payslip.reference}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[12.5px] mb-4">
              <div>
                <span className="text-[#A7B3C6] block text-[11px] font-medium">Pay Period</span>
                <span className="font-semibold text-[#F8FAFC]">{payslip.period_name}</span>
              </div>

              <div>
                <span className="text-[#A7B3C6] block text-[11px] font-medium">Period Dates</span>
                <span className="text-[#F8FAFC] font-mono">{payslip.period_date_from} → {payslip.period_date_to}</span>
              </div>

              <div>
                <span className="text-[#A7B3C6] block text-[11px] font-medium">Salary Structure</span>
                <span className="text-[#F8FAFC]">{payslip.salary_structure_name}</span>
              </div>

              <div>
                <span className="text-[#A7B3C6] block text-[11px] font-medium">Pay Run</span>
                <span className="text-[#F8FAFC]">{payslip.payrun_name}</span>
              </div>
            </div>

            {/* Attendance & Worked Days Grid */}
            <div className="bg-[#0F172A] border border-[#263449] rounded-[8px] p-3 grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-[10px] text-[#A7B3C6] uppercase font-bold">Total Days</div>
                <div className="text-[14px] font-bold text-[#F8FAFC]">{payslip.total_working_days}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#A7B3C6] uppercase font-bold">Worked</div>
                <div className="text-[14px] font-bold text-[#22C55E]">{payslip.days_worked}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#A7B3C6] uppercase font-bold">Absent</div>
                <div className="text-[14px] font-bold text-[#EF4444]">{payslip.days_absent}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#A7B3C6] uppercase font-bold">Leave</div>
                <div className="text-[14px] font-bold text-[#4F8CFF]">{payslip.leave_days_taken}</div>
              </div>
            </div>
          </div>

          {/* Financial Totals Summary Row */}
          <div className="mt-4 pt-3 border-t border-[#263449] flex items-center justify-between text-[12.5px]">
            <div className="flex space-x-4">
              <div>
                <span className="text-[#A7B3C6] text-[11px] block">Gross Salary</span>
                <span className="font-semibold text-[#F8FAFC] font-mono">{formatCurrency(payslip.gross_salary)}</span>
              </div>
              <div>
                <span className="text-[#A7B3C6] text-[11px] block">Deductions</span>
                <span className="font-semibold text-[#EF4444] font-mono">-{formatCurrency(payslip.total_deductions)}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[#2DD4BF] text-[10.5px] uppercase font-bold block">Net Salary</span>
              <span className="text-[17px] font-bold text-[#2DD4BF] font-mono">{formatCurrency(payslip.net_salary)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Computation Breakdown Table */}
      <SalaryComputationTable
        lines={payslip.lines || []}
        netSalary={payslip.net_salary}
      />
    </div>
  );
}

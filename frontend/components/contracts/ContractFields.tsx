"use client";

import React from "react";
import { ContractFormOptions } from "../../lib/api";

export interface ContractFormData {
  employee_id: number | "";
  department_id: number | "";
  job_position_id: number | "";
  date_start: string;
  date_end: string;
  wage_amount: string;
  working_schedule_id: number | "";
  salary_structure_id: number | "";
  state: string;
  notes: string;
  reference?: string;
}

interface ContractFieldsProps {
  formData: ContractFormData;
  onChange: (field: keyof ContractFormData, value: any) => void;
  options: ContractFormOptions;
  isCreateMode?: boolean;
}

export default function ContractFields({
  formData,
  onChange,
  options,
  isCreateMode = false,
}: ContractFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
      {/* LEFT COLUMN */}
      <div className="space-y-4">
        {/* Employee Field */}
        <div>
          <label className="block text-[12.5px] font-semibold text-[#F8FAFC] mb-1.5">
            Employee <span className="text-[#EF4444]">*</span>
          </label>
          <select
            value={formData.employee_id}
            onChange={(e) => onChange("employee_id", e.target.value ? Number(e.target.value) : "")}
            disabled={!isCreateMode}
            className={`w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 outline-none transition-colors ${
              !isCreateMode ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            <option value="">Select Employee...</option>
            {options.employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employee_code})
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[12.5px] font-semibold text-[#F8FAFC] mb-1.5">
            Start Date <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="date"
            value={formData.date_start}
            onChange={(e) => onChange("date_start", e.target.value)}
            className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 outline-none transition-colors"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[12.5px] font-semibold text-[#F8FAFC] mb-1.5">
            End Date <span className="text-[#94A3B8] font-normal">(Leave blank for open-ended contract)</span>
          </label>
          <input
            type="date"
            value={formData.date_end}
            onChange={(e) => onChange("date_end", e.target.value)}
            className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 outline-none transition-colors"
          />
        </div>

        {/* Status Control */}
        <div>
          <label className="block text-[12.5px] font-semibold text-[#F8FAFC] mb-1.5">
            Status <span className="text-[#EF4444]">*</span>
          </label>
          <select
            value={formData.state}
            onChange={(e) => onChange("state", e.target.value)}
            className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 outline-none transition-colors"
          >
            <option value="active">Running</option>
            <option value="draft">Draft</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-4">
        {/* Department */}
        <div>
          <label className="block text-[12.5px] font-semibold text-[#F8FAFC] mb-1.5">
            Department
          </label>
          <select
            value={formData.department_id}
            onChange={(e) => onChange("department_id", e.target.value ? Number(e.target.value) : "")}
            className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 outline-none transition-colors"
          >
            <option value="">Select Department...</option>
            {options.departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Job Position */}
        <div>
          <label className="block text-[12.5px] font-semibold text-[#F8FAFC] mb-1.5">
            Job Position
          </label>
          <select
            value={formData.job_position_id}
            onChange={(e) => onChange("job_position_id", e.target.value ? Number(e.target.value) : "")}
            className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 outline-none transition-colors"
          >
            <option value="">Select Job Position...</option>
            {options.job_positions.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.title}
              </option>
            ))}
          </select>
        </div>

        {/* Wage / Month */}
        <div>
          <label className="block text-[12.5px] font-semibold text-[#F8FAFC] mb-1.5">
            Wage / Month (₹) <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8] font-semibold">
              ₹
            </span>
            <input
              type="number"
              min="0"
              step="500"
              value={formData.wage_amount}
              onChange={(e) => onChange("wage_amount", e.target.value)}
              placeholder="e.g. 85000"
              className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] pl-8 pr-3 py-2 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Working Schedule */}
        <div>
          <label className="block text-[12.5px] font-semibold text-[#F8FAFC] mb-1.5">
            Working Schedule
          </label>
          <select
            value={formData.working_schedule_id}
            onChange={(e) => onChange("working_schedule_id", e.target.value ? Number(e.target.value) : "")}
            className="w-full bg-[#0F172A] border border-[#263449] focus:border-[#4F8CFF] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 outline-none transition-colors"
          >
            <option value="">Select Working Schedule...</option>
            {options.working_schedules.map((sched) => (
              <option key={sched.id} value={sched.id}>
                {sched.name} ({sched.total_weekly_hours} Hours/Week)
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

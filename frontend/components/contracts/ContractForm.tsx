"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContractFields, { ContractFormData } from "./ContractFields";
import ContractNotes from "./ContractNotes";
import {
  ContractRecord,
  ContractFormOptions,
  createContractApi,
  updateContractApi,
} from "../../lib/api";

interface ContractFormProps {
  initialContract?: ContractRecord | null;
  options: ContractFormOptions;
  isCreateMode?: boolean;
}

export default function ContractForm({
  initialContract,
  options,
  isCreateMode = false,
}: ContractFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<ContractFormData>({
    employee_id: initialContract?.employee_id || (options.employees[0]?.id || ""),
    department_id: initialContract?.department_id || (options.departments[0]?.id || ""),
    job_position_id: initialContract?.job_position_id || (options.job_positions[0]?.id || ""),
    date_start: initialContract?.date_start || new Date().toISOString().split("T")[0],
    date_end: initialContract?.date_end || "",
    wage_amount: initialContract?.wage_amount ? String(initialContract.wage_amount) : "75000",
    working_schedule_id: initialContract?.working_schedule_id || (options.working_schedules[0]?.id || ""),
    salary_structure_id: initialContract?.salary_structure_id || (options.salary_structures[0]?.id || ""),
    state: initialContract?.state || "active",
    notes: initialContract?.notes || "",
    reference: initialContract?.reference || "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync form data if initialContract changes
  useEffect(() => {
    if (initialContract) {
      setFormData({
        employee_id: initialContract.employee_id,
        department_id: initialContract.department_id || "",
        job_position_id: initialContract.job_position_id || "",
        date_start: initialContract.date_start ? initialContract.date_start.split("T")[0] : "",
        date_end: initialContract.date_end ? initialContract.date_end.split("T")[0] : "",
        wage_amount: initialContract.wage_amount ? String(initialContract.wage_amount) : "0",
        working_schedule_id: initialContract.working_schedule_id || "",
        salary_structure_id: initialContract.salary_structure_id || "",
        state: initialContract.state || "active",
        notes: initialContract.notes || "",
        reference: initialContract.reference || "",
      });
    }
  }, [initialContract]);

  const handleChange = (field: keyof ContractFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // 1. Frontend Validations
    if (!formData.employee_id) {
      setErrorMsg("Please select an employee.");
      return;
    }

    if (!formData.date_start) {
      setErrorMsg("Start date is required.");
      return;
    }

    if (formData.date_end) {
      if (new Date(formData.date_end) < new Date(formData.date_start)) {
        setErrorMsg("End date must be greater than or equal to start date.");
        return;
      }
    }

    const wageNum = parseFloat(formData.wage_amount);
    if (isNaN(wageNum) || wageNum < 0) {
      setErrorMsg("Please enter a valid non-negative monthly wage amount.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        employee_id: Number(formData.employee_id),
        date_start: formData.date_start,
        date_end: formData.date_end ? formData.date_end : null,
        wage_amount: wageNum,
        department_id: formData.department_id ? Number(formData.department_id) : undefined,
        job_position_id: formData.job_position_id ? Number(formData.job_position_id) : undefined,
        working_schedule_id: formData.working_schedule_id ? Number(formData.working_schedule_id) : undefined,
        salary_structure_id: formData.salary_structure_id ? Number(formData.salary_structure_id) : undefined,
        state: formData.state,
        notes: formData.notes || undefined,
      };

      if (isCreateMode) {
        const res = await createContractApi(payload);
        if (res.success && res.data?.contract) {
          setSuccessMsg("Contract created successfully! Redirecting...");
          setTimeout(() => {
            window.location.href = "/employees/contracts";
          }, 1200);
        } else {
          if (res.error?.includes("running contract") || res.error?.includes("already has")) {
            setErrorMsg("Employee already has a running contract for this period.");
          } else {
            setErrorMsg(res.error || "Failed to create contract.");
          }
        }
      } else if (initialContract?.id) {
        const res = await updateContractApi(initialContract.id, payload);
        if (res.success && res.data?.contract) {
          setSuccessMsg("Contract changes saved successfully!");
        } else {
          if (res.error?.includes("running contract") || res.error?.includes("already has")) {
            setErrorMsg("Employee already has a running contract for this period.");
          } else {
            setErrorMsg(res.error || "Failed to update contract.");
          }
        }
      }
    } catch (err: any) {
      console.error("Form submit error:", err);
      setErrorMsg("Something went wrong. Please check your inputs and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const contractRef = initialContract?.reference || initialContract?.contract_reference || "CON/2026/NEW";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#263449]/60 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-[12px] text-[#94A3B8] mb-1">
            <Link href="/employees/contracts" className="hover:text-[#F8FAFC] transition-colors">
              Contracts
            </Link>
            <span>/</span>
            <span className="text-[#F8FAFC] font-medium">{contractRef}</span>
          </div>
          <h1 className="text-[22px] font-bold text-[#F8FAFC] tracking-tight">
            {isCreateMode ? "New Contract" : `Contract / ${contractRef}`}
          </h1>
          <p className="text-[12.5px] text-[#94A3B8] font-medium mt-0.5">
            Form view of one contract
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Link
            href="/employees/contracts"
            className="px-4 py-2 bg-[#172033] border border-[#263449] hover:bg-[#1E293B] text-[#F8FAFC] text-[13px] font-medium rounded-[8px] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center bg-[#4F8CFF] hover:bg-[#3B82F6] disabled:opacity-60 text-white font-semibold text-[13px] px-5 py-2 rounded-[8px] transition-all shadow-sm shrink-0"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : isCreateMode ? (
              "Create Contract"
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {/* Error & Success Banners */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-[10px] bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[13px] font-medium flex items-center space-x-2.5">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-[10px] bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-[13px] font-medium flex items-center space-x-2.5">
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Two-Column Enterprise Form Card */}
      <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-6 shadow-sm">
        <ContractFields
          formData={formData}
          onChange={handleChange}
          options={options}
          isCreateMode={isCreateMode}
        />
      </div>

      {/* Salary Structure / Notes Panel */}
      <ContractNotes
        salaryStructureName={
          options.salary_structures.find((s) => s.id === Number(formData.salary_structure_id))?.name ||
          initialContract?.salary_structure
        }
        notes={formData.notes}
      />
    </form>
  );
}

"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getTimeOffAllocationByIdApi,
  createTimeOffAllocationApi,
  updateTimeOffAllocationApi,
  deleteTimeOffAllocationApi,
  approveTimeOffAllocationApi,
  getTimeOffTypesApi,
  getEmployeesApi,
  TimeOffAllocationRecord,
  TimeOffTypeRecord,
  EmployeeOption,
} from "../../../lib/api";

export default function AllocationDetail({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [types, setTypes] = useState<TimeOffTypeRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const [formData, setFormData] = useState({
    employee_id: "",
    time_off_type_id: "",
    description: "",
    allocated_days: 0,
    valid_from: "",
    valid_until: "",
  });

  const [allocation, setAllocation] = useState<TimeOffAllocationRecord | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchOptions();
    if (!isNew) {
      fetchAllocation();
    }
  }, [id, isNew]);

  const fetchOptions = async () => {
    try {
      const [typesRes, empRes] = await Promise.all([
        getTimeOffTypesApi({ status: "active", limit: 100 }),
        getEmployeesApi(),
      ]);
      if (typesRes.success && typesRes.data) {
        setTypes(typesRes.data);
      }
      if (empRes.success && empRes.data?.employees) {
        setEmployees(empRes.data.employees);
      }
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  const fetchAllocation = async () => {
    try {
      const res = await getTimeOffAllocationByIdApi(id);
      if (res.success && res.data) {
        setAllocation(res.data);
        setFormData({
          employee_id: res.data.employee_id.toString(),
          time_off_type_id: res.data.time_off_type_id.toString(),
          description: res.data.description || "",
          allocated_days: res.data.allocated_days,
          valid_from: res.data.valid_from ? res.data.valid_from.split("T")[0] : "",
          valid_until: res.data.valid_until ? res.data.valid_until.split("T")[0] : "",
        });
      } else {
        setError(res.error || "Failed to load allocation");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.employee_id || !formData.time_off_type_id || !formData.allocated_days) {
      setError("Employee, Time Off Type, and Allocated Days are required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        employee_id: parseInt(formData.employee_id, 10),
        time_off_type_id: parseInt(formData.time_off_type_id, 10),
        description: formData.description,
        allocated_days: Number(formData.allocated_days),
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      };

      let res;
      if (isNew) {
        res = await createTimeOffAllocationApi(payload);
      } else {
        res = await updateTimeOffAllocationApi(id, payload);
      }

      if (res.success) {
        router.push("/time-off/allocations");
      } else {
        setError(res.error || "Failed to save allocation");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this allocation?")) return;
    setSaving(true);
    try {
      const res = await deleteTimeOffAllocationApi(id);
      if (res.success) {
        router.push("/time-off/allocations");
      } else {
        setError(res.error || "Failed to delete allocation");
        setSaving(false);
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    try {
      const res = await approveTimeOffAllocationApi(id);
      if (res.success) {
        fetchAllocation();
      } else {
        setError(res.error || "Failed to approve allocation");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-6 h-6 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isDraft = allocation?.state === "draft";
  const isApproved = allocation?.state === "approved";
  const canEdit = isNew || isDraft;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/time-off/allocations")}
            className="p-2 rounded-full hover:bg-[#172033] text-[#A7B3C6] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-[20px] font-bold text-[#F8FAFC]">
            {isNew ? "New Allocation" : "Allocation Details"}
          </h1>
          {!isNew && allocation && (
            <div className="ml-4">
              {allocation.state === "approved" && (
                <span className="inline-flex px-2.5 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-[12px] font-semibold border border-[#22C55E]/20">
                  Approved
                </span>
              )}
              {allocation.state === "draft" && (
                <span className="inline-flex px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-[12px] font-semibold border border-[#F59E0B]/20">
                  To Approve
                </span>
              )}
              {allocation.state === "refused" && (
                <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[12px] font-semibold border border-[#EF4444]/20">
                  Refused
                </span>
              )}
            </div>
          )}
        </div>
        {!isNew && isDraft && (
          <button
            onClick={handleApprove}
            disabled={saving}
            className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-[13px] font-semibold rounded-[8px] transition-colors shadow-sm"
          >
            Approve Allocation
          </button>
        )}
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[8px] p-4 text-[#EF4444] text-[13px] flex items-start space-x-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {/* Balance Visualization for existing allocations */}
      {!isNew && allocation && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 text-center">
            <div className="text-[12px] font-medium text-[#94A3B8] mb-1 uppercase tracking-wider">Allocated</div>
            <div className="text-[28px] font-bold text-[#F8FAFC]">{allocation.allocated_days}</div>
            <div className="text-[12px] text-[#64748B]">Days</div>
          </div>
          <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-5 text-center">
            <div className="text-[12px] font-medium text-[#94A3B8] mb-1 uppercase tracking-wider">Used</div>
            <div className="text-[28px] font-bold text-[#F59E0B]">{allocation.used_days}</div>
            <div className="text-[12px] text-[#64748B]">Days</div>
          </div>
          <div className="bg-[#172033] border-2 border-[#4F8CFF]/30 rounded-[12px] p-5 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4F8CFF]/5 to-transparent"></div>
            <div className="relative z-10">
              <div className="text-[12px] font-semibold text-[#4F8CFF] mb-1 uppercase tracking-wider">Remaining</div>
              <div className="text-[28px] font-bold text-[#4F8CFF]">{(allocation.allocated_days - allocation.used_days)}</div>
              <div className="text-[12px] text-[#4F8CFF]/70">Days</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#94A3B8]">Employee <span className="text-[#EF4444]">*</span></label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all disabled:opacity-50 appearance-none"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#94A3B8]">Time Off Type <span className="text-[#EF4444]">*</span></label>
            <select
              value={formData.time_off_type_id}
              onChange={(e) => setFormData({ ...formData, time_off_type_id: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all disabled:opacity-50 appearance-none"
            >
              <option value="">Select Type</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#94A3B8]">Allocated Days <span className="text-[#EF4444]">*</span></label>
            <input
              type="number"
              step="0.5"
              value={formData.allocated_days}
              onChange={(e) => setFormData({ ...formData, allocated_days: parseFloat(e.target.value) || 0 })}
              disabled={!canEdit}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#94A3B8]">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all disabled:opacity-50"
              placeholder="e.g. 2024 Annual Grant"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#94A3B8]">Valid From</label>
            <input
              type="date"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#94A3B8]">Valid Until</label>
            <input
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              disabled={!canEdit}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center justify-between pt-6 border-t border-[#263449]">
            {!isNew ? (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] text-[13px] font-semibold rounded-[8px] transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete</span>
              </button>
            ) : (
              <div></div>
            )}
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/time-off/allocations")}
                disabled={saving}
                className="px-4 py-2 bg-transparent hover:bg-[#172033] text-[#A7B3C6] hover:text-[#F8FAFC] text-[13px] font-medium rounded-[8px] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-[#4F8CFF] hover:bg-[#3B82F6] disabled:opacity-50 text-white text-[13px] font-semibold rounded-[8px] transition-colors shadow-sm shadow-[#4F8CFF]/20"
              >
                {saving ? "Saving..." : "Save Allocation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

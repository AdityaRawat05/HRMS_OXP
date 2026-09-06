"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getTimeOffRequestByIdApi,
  createTimeOffRequestApi,
  updateTimeOffRequestApi,
  deleteTimeOffRequestApi,
  approveTimeOffRequestApi,
  refuseTimeOffRequestApi,
  getTimeOffTypesApi,
  getEmployeesApi,
  TimeOffRequestRecord,
  TimeOffTypeRecord,
  EmployeeOption,
  getCurrentUserApi,
} from "../../../lib/api";

export default function RequestDetail({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [types, setTypes] = useState<TimeOffTypeRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [canManageTeam, setCanManageTeam] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    employee_id: "",
    time_off_type_id: "",
    description: "",
    date_from: "",
    date_to: "",
    days_requested: 0,
  });

  const [request, setRequest] = useState<TimeOffRequestRecord | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchOptions();
    if (!isNew) {
      fetchRequest();
    }
  }, [id, isNew]);

  const fetchOptions = async () => {
    try {
      const [typesRes, empRes, userRes] = await Promise.all([
        getTimeOffTypesApi({ status: "active", limit: 100 }),
        getEmployeesApi(),
        getCurrentUserApi()
      ]);
      
      if (typesRes.success && typesRes.data) {
        setTypes(typesRes.data);
      }
      if (empRes.success && empRes.data?.employees) {
        setEmployees(empRes.data.employees);
      }
      if (userRes.success && userRes.data) {
        const data = userRes.data;
        const roles = data.roles.map(r => r.name);
        if (roles.includes("hr_admin") || roles.includes("admin") || roles.includes("manager")) {
          setCanManageTeam(true);
        }
        if (data.user?.employee?.id) {
          const empId = data.user.employee.id;
          setCurrentUserId(empId);
          // If creating new and not a manager/admin, auto-select current employee
          if (isNew && !roles.includes("hr_admin") && !roles.includes("admin")) {
            setFormData(prev => ({ ...prev, employee_id: empId.toString() }));
          }
        }
      }
    } catch (err) {
      console.error("Failed to load options", err);
    }
  };

  const fetchRequest = async () => {
    try {
      const res = await getTimeOffRequestByIdApi(id);
      if (res.success && res.data) {
        setRequest(res.data);
        setFormData({
          employee_id: res.data.employee_id.toString(),
          time_off_type_id: res.data.time_off_type_id.toString(),
          description: res.data.description || "",
          date_from: res.data.date_from ? res.data.date_from.split("T")[0] : "",
          date_to: res.data.date_to ? res.data.date_to.split("T")[0] : "",
          days_requested: res.data.days_requested,
        });
      } else {
        setError(res.error || "Failed to load request");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (formData.date_from && formData.date_to) {
      const d1 = new Date(formData.date_from);
      const d2 = new Date(formData.date_to);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      
      // Basic weekend exclusion logic (can be refined based on working schedule later)
      let count = 0;
      let curDate = new Date(d1);
      while (curDate <= d2) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        curDate.setDate(curDate.getDate() + 1);
      }
      
      setFormData({ ...formData, days_requested: count > 0 ? count : diffDays });
    }
  };

  const handleSave = async () => {
    if (!formData.employee_id || !formData.time_off_type_id || !formData.date_from || !formData.date_to || formData.days_requested <= 0) {
      setError("Employee, Time Off Type, Dates, and valid Days are required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        employee_id: parseInt(formData.employee_id, 10),
        time_off_type_id: parseInt(formData.time_off_type_id, 10),
        description: formData.description,
        date_from: new Date(formData.date_from).toISOString(),
        date_to: new Date(formData.date_to).toISOString(),
        days_requested: Number(formData.days_requested),
      };

      let res;
      if (isNew) {
        res = await createTimeOffRequestApi(payload);
      } else {
        res = await updateTimeOffRequestApi(id, payload);
      }

      if (res.success) {
        router.push("/time-off/requests");
      } else {
        setError(res.error || "Failed to save request");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this request?")) return;
    setSaving(true);
    try {
      const res = await deleteTimeOffRequestApi(id);
      if (res.success) {
        router.push("/time-off/requests");
      } else {
        setError(res.error || "Failed to delete request");
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
      const res = await approveTimeOffRequestApi(id);
      if (res.success) {
        fetchRequest();
      } else {
        setError(res.error || "Failed to approve request");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleRefuse = async () => {
    setSaving(true);
    try {
      const res = await refuseTimeOffRequestApi(id);
      if (res.success) {
        fetchRequest();
      } else {
        setError(res.error || "Failed to refuse request");
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

  const isDraft = request?.state === "draft";
  const canEdit = isNew || isDraft;
  const isApprover = canManageTeam; 

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push("/time-off/requests")}
            className="p-2 rounded-full hover:bg-[#172033] text-[#A7B3C6] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-[20px] font-bold text-[#F8FAFC]">
            {isNew ? "New Time Off Request" : "Request Details"}
          </h1>
          {!isNew && request && (
            <div className="ml-4">
              {request.state === "approved" && (
                <span className="inline-flex px-2.5 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-[12px] font-semibold border border-[#22C55E]/20">
                  Approved
                </span>
              )}
              {request.state === "draft" && (
                <span className="inline-flex px-2.5 py-1 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-[12px] font-semibold border border-[#F59E0B]/20">
                  To Approve
                </span>
              )}
              {request.state === "refused" && (
                <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EF4444]/10 text-[#EF4444] text-[12px] font-semibold border border-[#EF4444]/20">
                  Refused
                </span>
              )}
            </div>
          )}
        </div>
        
        {!isNew && isDraft && isApprover && (
          <div className="flex items-center space-x-3">
             <button
              onClick={handleRefuse}
              disabled={saving}
              className="px-4 py-2 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] text-[13px] font-semibold rounded-[8px] transition-colors shadow-sm"
            >
              Refuse
            </button>
            <button
              onClick={handleApprove}
              disabled={saving}
              className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-[13px] font-semibold rounded-[8px] transition-colors shadow-sm"
            >
              Approve
            </button>
          </div>
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

      <div className="bg-[#111827] border border-[#263449] rounded-[12px] p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#94A3B8]">Employee <span className="text-[#EF4444]">*</span></label>
            <select
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              disabled={!canEdit || (!canManageTeam && !isNew)} // Normally only managers can change this, or users selecting themselves initially
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
            <label className="text-[12px] font-medium text-[#94A3B8]">Date From <span className="text-[#EF4444]">*</span></label>
            <input
              type="date"
              value={formData.date_from}
              onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
              onBlur={calculateDays}
              disabled={!canEdit}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#94A3B8]">Date To <span className="text-[#EF4444]">*</span></label>
            <input
              type="date"
              value={formData.date_to}
              onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
              onBlur={calculateDays}
              disabled={!canEdit}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#94A3B8]">Days Requested <span className="text-[#EF4444]">*</span></label>
            <input
              type="number"
              step="0.5"
              value={formData.days_requested}
              onChange={(e) => setFormData({ ...formData, days_requested: parseFloat(e.target.value) || 0 })}
              disabled={!canEdit}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-[#94A3B8]">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={!canEdit}
            className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all disabled:opacity-50 min-h-[80px]"
            placeholder="e.g. Vacation, Doctor appointment, etc."
          />
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
                onClick={() => router.push("/time-off/requests")}
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
                {saving ? "Saving..." : "Save Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

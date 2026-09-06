"use client";
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTimeOffTypeByIdApi, createTimeOffTypeApi, updateTimeOffTypeApi, deleteTimeOffTypeApi, TimeOffTypeRecord } from "../../../lib/api";

export default function TypeDetail({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    requires_approval: true,
    is_active: true,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isNew) {
      fetchType();
    }
  }, [id, isNew]);

  const fetchType = async () => {
    try {
      const res = await getTimeOffTypeByIdApi(id);
      if (res.success && res.data) {
        setFormData({
          name: res.data.name,
          code: res.data.code,
          description: res.data.description || "",
          requires_approval: res.data.requires_approval,
          is_active: res.data.is_active,
        });
      } else {
        setError(res.error || "Failed to load time off type");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      setError("Name and Code are required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let res;
      if (isNew) {
        res = await createTimeOffTypeApi(formData);
      } else {
        res = await updateTimeOffTypeApi(id, formData);
      }

      if (res.success) {
        router.push("/time-off/types");
      } else {
        setError(res.error || "Failed to save time off type");
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this time off type?")) return;
    setSaving(true);
    try {
      const res = await deleteTimeOffTypeApi(id);
      if (res.success) {
        router.push("/time-off/types");
      } else {
        setError(res.error || "Failed to delete time off type");
        setSaving(false);
      }
    } catch (err: any) {
      setError("An unexpected error occurred");
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => router.push("/time-off/types")}
          className="p-2 rounded-full hover:bg-[#172033] text-[#A7B3C6] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-[20px] font-bold text-[#F8FAFC]">
          {isNew ? "New Time Off Type" : "Edit Time Off Type"}
        </h1>
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
            <label className="text-[12px] font-medium text-[#94A3B8]">Name <span className="text-[#EF4444]">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all"
              placeholder="e.g. Annual Leave"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#94A3B8]">Code <span className="text-[#EF4444]">*</span></label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all uppercase"
              placeholder="e.g. AL"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-[#94A3B8]">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-[#0F172A] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px] px-3 py-2 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all min-h-[100px]"
            placeholder="Add some details about this policy..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#263449]">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={formData.requires_approval}
                onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                className="peer sr-only"
              />
              <div className="w-10 h-5 bg-[#0F172A] border border-[#263449] rounded-full peer-checked:bg-[#4F8CFF] peer-checked:border-[#4F8CFF] transition-colors"></div>
              <div className="absolute left-[3px] w-4 h-4 bg-[#64748B] rounded-full transition-all peer-checked:bg-white peer-checked:translate-x-5"></div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-[#F8FAFC]">Requires Approval</div>
              <div className="text-[11px] text-[#94A3B8]">Manager must approve requests</div>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="peer sr-only"
              />
              <div className="w-10 h-5 bg-[#0F172A] border border-[#263449] rounded-full peer-checked:bg-[#22C55E] peer-checked:border-[#22C55E] transition-colors"></div>
              <div className="absolute left-[3px] w-4 h-4 bg-[#64748B] rounded-full transition-all peer-checked:bg-white peer-checked:translate-x-5"></div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-[#F8FAFC]">Active Status</div>
              <div className="text-[11px] text-[#94A3B8]">Can be used by employees</div>
            </div>
          </label>
        </div>

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
              onClick={() => router.push("/time-off/types")}
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
              {saving ? "Saving..." : "Save Type"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

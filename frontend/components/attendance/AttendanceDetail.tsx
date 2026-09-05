"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AttendanceStatusBadge from "./AttendanceStatusBadge";
import AttendanceNotes from "./AttendanceNotes";
import AttendanceForm from "./AttendanceForm";
import { AttendanceRecord, deleteAttendanceApi } from "../../lib/api";

interface AttendanceDetailProps {
  record: AttendanceRecord;
  onRefresh?: () => void;
  isAdmin?: boolean;
}

export default function AttendanceDetail({
  record,
  onRefresh,
  isAdmin = true,
}: AttendanceDetailProps) {
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const empName = record.employee_name || record.employee?.name || "Employee";
  const formattedDate = record.attendance_date
    ? new Date(record.attendance_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Date";

  const workedHoursStr = record.worked_hours !== null && record.worked_hours !== undefined
    ? `${Number(record.worked_hours).toFixed(2)} hrs`
    : record.running_worked_hours
    ? `${Number(record.running_worked_hours).toFixed(2)} hrs (running)`
    : "0.00 hrs";

  const overtimeHoursStr = `${Number(record.overtime_hours || 0).toFixed(2)} hrs`;

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this attendance record for ${empName} on ${formattedDate}?`)) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteAttendanceApi(record.id);
      if (res.success) {
        router.push("/attendance");
      } else {
        setDeleteError(res.error || "Failed to delete attendance record.");
      }
    } catch (err: any) {
      console.error("Delete attendance error:", err);
      setDeleteError("An error occurred while deleting.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto space-y-6">
      {/* Top Breadcrumb Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#263449]/60 gap-4">
        <div>
          {/* Title Path: Attendance / Employee / Date */}
          <div className="flex items-center space-x-2 text-[18px] font-bold text-[#F8FAFC]">
            <Link href="/attendance" className="text-[#A7B3C6] hover:text-[#F8FAFC] transition-colors">
              Attendance
            </Link>
            <span className="text-[#64748B]">/</span>
            <span className="text-[#F8FAFC]">{empName}</span>
            <span className="text-[#64748B]">/</span>
            <span className="text-[#4F8CFF]">{formattedDate}</span>
          </div>
          <p className="text-[12.5px] text-[#94A3B8] font-medium mt-0.5">
            Form view of one attendance record
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Link
            href="/attendance"
            className="px-3.5 py-1.5 bg-[#172033] border border-[#263449] hover:bg-[#1E293B] text-[#A7B3C6] hover:text-[#F8FAFC] text-[12.5px] font-medium rounded-[8px] transition-colors"
          >
            Back to List
          </Link>

          {isAdmin && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-4 py-1.5 bg-[#4F8CFF] hover:bg-[#3B82F6] text-white text-[13px] font-semibold rounded-[8px] transition-all shadow-sm active:scale-[0.98]"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                EDIT
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/30 text-[#EF4444] text-[12.5px] font-semibold rounded-[8px] transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </>
          )}
        </div>
      </div>

      {deleteError && (
        <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[8px] text-[#EF4444] text-[12.5px]">
          {deleteError}
        </div>
      )}

      {/* Main Two-Column Detail Card */}
      <div className="bg-[#111827] border border-[#263449] rounded-[14px] p-6 shadow-sm">
        <h2 className="text-[14px] font-bold text-[#F8FAFC] tracking-wide border-b border-[#263449] pb-3 mb-5">
          Record Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[13.5px]">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            <div>
              <span className="text-[12px] text-[#64748B] font-semibold uppercase tracking-wider block mb-1">
                Employee
              </span>
              <span className="font-bold text-[#F8FAFC] text-[15px] block">
                {empName}
              </span>
              <span className="text-[12px] text-[#94A3B8]">
                Code: {record.employee?.employee_code || "N/A"} • Email: {record.employee?.work_email || "N/A"}
              </span>
            </div>

            <div className="pt-2 border-t border-[#1E293B]">
              <span className="text-[12px] text-[#64748B] font-semibold uppercase tracking-wider block mb-1">
                Check In
              </span>
              <span className="font-mono text-[#4F8CFF] font-bold text-[15px] block">
                {record.check_in_time}
              </span>
              {record.check_in && (
                <span className="text-[11.5px] text-[#64748B]">
                  Full timestamp: {new Date(record.check_in).toLocaleString()}
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-[#1E293B]">
              <span className="text-[12px] text-[#64748B] font-semibold uppercase tracking-wider block mb-1">
                Check Out
              </span>
              <span className="font-mono text-[#A7B3C6] font-bold text-[15px] block">
                {record.check_out_time}
              </span>
              {record.check_out && (
                <span className="text-[11.5px] text-[#64748B]">
                  Full timestamp: {new Date(record.check_out).toLocaleString()}
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-[#1E293B]">
              <span className="text-[12px] text-[#64748B] font-semibold uppercase tracking-wider block mb-1">
                Worked Hours
              </span>
              <span className="font-mono font-extrabold text-[#F8FAFC] text-[16px] block">
                {workedHoursStr}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            <div>
              <span className="text-[12px] text-[#64748B] font-semibold uppercase tracking-wider block mb-1">
                Department
              </span>
              <span className="font-bold text-[#F8FAFC] text-[15px] block">
                {record.department || "Unassigned"}
              </span>
            </div>

            <div className="pt-2 border-t border-[#1E293B]">
              <span className="text-[12px] text-[#64748B] font-semibold uppercase tracking-wider block mb-1">
                Manager
              </span>
              <span className="font-semibold text-[#F8FAFC] text-[14px] block">
                {record.manager || "N/A"}
              </span>
            </div>

            <div className="pt-2 border-t border-[#1E293B]">
              <span className="text-[12px] text-[#64748B] font-semibold uppercase tracking-wider block mb-1">
                Status
              </span>
              <div className="mt-1">
                <AttendanceStatusBadge
                  status={record.status}
                  statusDisplay={record.status_display}
                  isLate={record.is_late}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E293B]">
              <span className="text-[12px] text-[#64748B] font-semibold uppercase tracking-wider block mb-1">
                Overtime
              </span>
              <span className="font-mono font-bold text-[#F8FAFC] text-[15px] block">
                {overtimeHoursStr}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Notes Panel */}
      <AttendanceNotes
        notes={record.notes}
        reason={record.correction_reason}
        source={record.source}
        isManuallyCorrected={record.is_manually_corrected}
      />

      {/* Edit Form Modal */}
      {showEditModal && (
        <AttendanceForm
          record={record}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

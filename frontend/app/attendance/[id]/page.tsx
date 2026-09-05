"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import PayrollNav from "../../../components/payroll/PayrollNav";
import AttendanceDetail from "../../../components/attendance/AttendanceDetail";
import {
  getAttendanceByIdApi,
  getCurrentUserApi,
  AttendanceRecord,
} from "../../../lib/api";

export default function AttendanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true);

  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Verify Authentication
  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await getCurrentUserApi();
        if (!res.success || !res.data?.authenticated) {
          router.push("/login");
        } else {
          setIsAdmin(Boolean(res.data.isAdmin));
          setAuthChecking(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      }
    }
    verifyAuth();
  }, [router]);

  // 2. Fetch Attendance Detail by ID
  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAttendanceByIdApi(id);
      if (res.success && res.data) {
        setRecord(res.data);
      } else {
        setError(res.error || "Attendance record not found.");
      }
    } catch (err: any) {
      console.error("Fetch attendance detail error:", err);
      setError("Unable to load attendance detail. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authChecking) return;
    fetchDetail();
  }, [id, authChecking, fetchDetail]);

  if (authChecking) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center space-x-2.5 text-[#A7B3C6] text-[13px]">
          <div className="w-4 h-4 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying authentication...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      {/* Global Enterprise Navigation */}
      <PayrollNav />

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading && (
          <div className="bg-[#111827] border border-[#263449] rounded-[14px] p-8 max-w-[1000px] mx-auto animate-pulse space-y-6">
            <div className="h-6 bg-[#1E293B] rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-20 bg-[#1E293B] rounded"></div>
              <div className="h-20 bg-[#1E293B] rounded"></div>
            </div>
            <div className="h-16 bg-[#1E293B] rounded"></div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-[#111827] border border-[#EF4444]/30 rounded-[14px] p-10 max-w-[800px] mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-[17px] font-bold text-[#F8FAFC]">Attendance record not found</h3>
            <p className="text-[13.5px] text-[#94A3B8] max-w-md mx-auto">{error}</p>
            <button
              onClick={() => router.push("/attendance")}
              className="px-4 py-2 bg-[#172033] border border-[#263449] hover:bg-[#1E293B] text-[#F8FAFC] text-[13px] font-semibold rounded-[8px] transition-colors"
            >
              Back to Attendance List
            </button>
          </div>
        )}

        {!loading && !error && record && (
          <AttendanceDetail
            record={record}
            onRefresh={fetchDetail}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </main>
  );
}

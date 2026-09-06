"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PayrollNav from "../../../components/payroll/PayrollNav";
import AllocationList from "../../../components/time-off/allocations/AllocationList";
import { getCurrentUserApi } from "../../../lib/api";

export default function TimeOffAllocationsPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const res = await getCurrentUserApi();
        if (!res.success || !res.data?.authenticated) {
          router.push("/login");
        } else {
          setAuthChecking(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      }
    }
    verifyAuth();
  }, [router]);

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
      <PayrollNav />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AllocationList />
      </div>
    </main>
  );
}

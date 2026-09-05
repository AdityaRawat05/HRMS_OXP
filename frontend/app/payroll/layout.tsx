"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PayrollNav from "../../components/payroll/PayrollNav";
import { getCurrentUserApi, AuthSessionData } from "../../lib/api";

export default function PayrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSessionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await getCurrentUserApi();
        if (!res.success || !res.data?.authenticated) {
          router.push("/login");
        } else {
          setSession(res.data);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[13px] text-[#A7B3C6] font-medium">Loading Payroll Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex flex-col font-sans">
      <PayrollNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}

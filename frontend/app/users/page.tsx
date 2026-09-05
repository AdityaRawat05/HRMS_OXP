"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import UserManagement from "../../components/users/UserManagement";
import { getCurrentUserApi, AuthSessionData } from "../../lib/api";

export default function UsersPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthSessionData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await getCurrentUserApi();
        if (res.success && res.data?.authenticated) {
          setAuthState(res.data);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Session verification failed:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, [router]);

  if (loading) {
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
    <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex flex-col justify-start py-6 sm:py-8 px-4 sm:px-6 md:px-8">
      <div className="w-full max-w-[1520px] mx-auto flex flex-col items-center">
        <UserManagement authState={authState} />
      </div>
    </main>
  );
}

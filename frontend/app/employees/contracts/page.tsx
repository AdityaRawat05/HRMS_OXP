"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import PayrollNav from "../../../components/payroll/PayrollNav";
import ContractList from "../../../components/contracts/ContractList";
import {
  getContractsApi,
  ContractRecord,
  getCurrentUserApi,
} from "../../../lib/api";

export default function ContractsListPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Session verification
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

  // 2. Fetch contracts from API
  const fetchContracts = useCallback(async (searchVal: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getContractsApi(searchVal);
      if (res.success && res.data?.contracts) {
        setContracts(res.data.contracts);
      } else {
        if (res.error?.includes("permission") || res.error?.includes("403")) {
          setError("You do not have permission to view contracts.");
        } else if (res.error?.includes("Authentication") || res.error?.includes("401")) {
          setError("Please sign in.");
        } else {
          setError(res.error || "Unable to load contracts.");
        }
        setContracts([]);
      }
    } catch (err: any) {
      console.error("Error fetching contracts:", err);
      setError("Something went wrong.");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    if (authChecking) return;

    const handler = setTimeout(() => {
      fetchContracts(searchQuery);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, authChecking, fetchContracts]);

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
      {/* Enterprise Header Navigation */}
      <PayrollNav />

      {/* Main Page Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ContractList
          contracts={contracts}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRetry={() => fetchContracts(searchQuery)}
        />
      </div>
    </main>
  );
}

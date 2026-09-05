"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PayrollNav from "../../../../components/payroll/PayrollNav";
import ContractForm from "../../../../components/contracts/ContractForm";
import {
  getContractOptionsApi,
  ContractFormOptions,
  getCurrentUserApi,
} from "../../../../lib/api";

export default function NewContractPage() {
  const router = useRouter();
  const [options, setOptions] = useState<ContractFormOptions>({
    employees: [],
    departments: [],
    job_positions: [],
    working_schedules: [],
    salary_structures: [],
  });

  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const userRes = await getCurrentUserApi();
        if (!userRes.success || !userRes.data?.authenticated) {
          router.push("/login");
          return;
        }
        setAuthChecking(false);

        const optionsRes = await getContractOptionsApi();
        if (optionsRes.success && optionsRes.data) {
          setOptions(optionsRes.data);
        } else {
          setError(optionsRes.error || "Failed to load contract form options.");
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Something went wrong while initializing form options.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  if (authChecking || loading) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center space-x-2.5 text-[#A7B3C6] text-[13px]">
          <div className="w-4 h-4 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
          <span>Loading contract creation options...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      {/* Enterprise Header Navigation */}
      <PayrollNav />

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {error ? (
          <div className="w-full bg-[#111827] border border-[#EF4444]/30 rounded-[12px] p-8 text-center my-4">
            <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">
              Unable to load creation form
            </h3>
            <p className="text-[13px] text-[#94A3B8] mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#172033] border border-[#263449] text-[#F8FAFC] text-[13px] rounded-[8px]"
            >
              Retry
            </button>
          </div>
        ) : (
          <ContractForm options={options} isCreateMode={true} />
        )}
      </div>
    </main>
  );
}

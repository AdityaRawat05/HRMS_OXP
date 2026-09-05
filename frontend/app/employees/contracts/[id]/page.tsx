"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PayrollNav from "../../../../components/payroll/PayrollNav";
import ContractForm from "../../../../components/contracts/ContractForm";
import {
  getContractByIdApi,
  getContractOptionsApi,
  ContractRecord,
  ContractFormOptions,
  getCurrentUserApi,
} from "../../../../lib/api";

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params?.id as string;

  const [contract, setContract] = useState<ContractRecord | null>(null);
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
    async function loadData() {
      if (!contractId) return;

      try {
        const userRes = await getCurrentUserApi();
        if (!userRes.success || !userRes.data?.authenticated) {
          router.push("/login");
          return;
        }
        setAuthChecking(false);

        const [contractRes, optionsRes] = await Promise.all([
          getContractByIdApi(contractId),
          getContractOptionsApi(),
        ]);

        if (optionsRes.success && optionsRes.data) {
          setOptions(optionsRes.data);
        }

        if (contractRes.success && contractRes.data?.contract) {
          setContract(contractRes.data.contract);
        } else {
          if (contractRes.error?.includes("404") || contractRes.error?.includes("not found")) {
            setError("Contract not found.");
          } else if (contractRes.error?.includes("403") || contractRes.error?.includes("permission")) {
            setError("You do not have permission.");
          } else {
            setError(contractRes.error || "Unable to load contract details.");
          }
        }
      } catch (err: any) {
        console.error("Error loading contract detail:", err);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [contractId, router]);

  if (authChecking || loading) {
    return (
      <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center space-x-2.5 text-[#A7B3C6] text-[13px]">
          <div className="w-4 h-4 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
          <span>Loading contract detail...</span>
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
            <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">
              {error}
            </h3>
            <p className="text-[13px] text-[#94A3B8] mb-4">
              The contract record you are trying to view might have been removed or does not exist.
            </p>
            <button
              onClick={() => router.push("/employees/contracts")}
              className="px-4 py-2 bg-[#172033] border border-[#263449] hover:bg-[#1E293B] text-[#F8FAFC] text-[13px] font-medium rounded-[8px] transition-colors"
            >
              Back to Contracts
            </button>
          </div>
        ) : (
          <ContractForm
            initialContract={contract}
            options={options}
            isCreateMode={false}
          />
        )}
      </div>
    </main>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import ContractToolbar from "./ContractToolbar";
import ContractTable from "./ContractTable";
import { ContractRecord } from "../../lib/api";

interface ContractListProps {
  contracts: ContractRecord[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRetry: () => void;
}

export default function ContractList({
  contracts,
  loading,
  error,
  searchQuery,
  onSearchChange,
  onRetry,
}: ContractListProps) {
  return (
    <div className="w-full">
      {/* Header Toolbar */}
      <ContractToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />

      {/* 1. Loading State */}
      {loading && (
        <div className="w-full bg-[#111827] border border-[#263449] rounded-[12px] p-8 text-center my-4">
          <div className="flex items-center justify-center space-x-2.5 text-[#A7B3C6] text-[13.5px]">
            <div className="w-4 h-4 border-2 border-[#4F8CFF] border-t-transparent rounded-full animate-spin"></div>
            <span>Loading employee contracts...</span>
          </div>
        </div>
      )}

      {/* 2. Error State */}
      {!loading && error && (
        <div className="w-full bg-[#111827] border border-[#EF4444]/30 rounded-[12px] p-8 text-center my-4">
          <div className="w-10 h-10 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">
            Unable to load contracts
          </h3>
          <p className="text-[13px] text-[#94A3B8] mb-4 max-w-md mx-auto">
            {error || "Unable to load contracts. Please try again."}
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-[#172033] border border-[#263449] hover:bg-[#1E293B] text-[#F8FAFC] text-[13px] font-medium rounded-[8px] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Empty State */}
      {!loading && !error && (!contracts || contracts.length === 0) && (
        <div className="w-full bg-[#111827] border border-[#263449] rounded-[12px] p-12 text-center my-4">
          <div className="w-12 h-12 rounded-full bg-[#172033] text-[#64748B] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-semibold text-[#F8FAFC] mb-1">
            {searchQuery ? "No contracts match your search." : "No contracts found."}
          </h3>
          <p className="text-[13px] text-[#94A3B8] mb-4">
            {searchQuery
              ? `No records found matching "${searchQuery}".`
              : "There are currently no active employee contract records in the system."}
          </p>
          {searchQuery ? (
            <button
              onClick={() => onSearchChange("")}
              className="inline-flex items-center px-3.5 py-1.5 bg-[#4F8CFF]/15 text-[#4F8CFF] border border-[#4F8CFF]/30 hover:bg-[#4F8CFF]/25 text-[12.5px] font-medium rounded-[6px] transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <Link
              href="/employees/contracts/new"
              className="inline-flex items-center justify-center bg-[#4F8CFF] hover:bg-[#3B82F6] text-white font-semibold text-[13px] px-4 py-2 rounded-[8px] transition-all shadow-sm"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              NEW
            </Link>
          )}
        </div>
      )}

      {/* 4. Table View */}
      {!loading && !error && contracts && contracts.length > 0 && (
        <ContractTable contracts={contracts} />
      )}
    </div>
  );
}

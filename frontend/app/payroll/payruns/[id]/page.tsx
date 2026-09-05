"use client";

import React from "react";
import PayrollNav from "../../../../components/payroll/PayrollNav";
import PayrunDetail from "../../../../components/payroll/PayrunDetail";

export default function PayrunDetailPage({ params }: { params: { id: string } }) {
  const numericId = Number(params.id);

  return (
    <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      <PayrollNav />
      {isNaN(numericId) ? (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-12 text-center text-[#EF4444]">
          Invalid Payrun ID.
        </div>
      ) : (
        <PayrunDetail id={numericId} />
      )}
    </main>
  );
}

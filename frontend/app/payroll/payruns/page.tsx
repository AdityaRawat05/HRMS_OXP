"use client";

import React from "react";
import PayrollNav from "../../../components/payroll/PayrollNav";
import PayrunList from "../../../components/payroll/PayrunList";

export default function PayrunsListPage() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      <PayrollNav />
      <PayrunList />
    </main>
  );
}

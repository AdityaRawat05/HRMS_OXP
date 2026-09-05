"use client";

import React from "react";
import PayrollNav from "../../../../components/payroll/PayrollNav";
import EmployeeSelection from "../../../../components/payroll/EmployeeSelection";

export default function NewPayrunPage() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      <PayrollNav />
      <EmployeeSelection />
    </main>
  );
}

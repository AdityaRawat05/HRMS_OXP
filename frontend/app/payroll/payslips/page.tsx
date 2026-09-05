import React from "react";
import PayrollNav from "../../../components/payroll/PayrollNav";
import PayslipList from "../../../components/payroll/PayslipList";

export const metadata = {
  title: "Payslips | PeoplePay360",
  description: "List view of employee payslips",
};

export default function PayslipsListPage() {
  return (
    <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      {/* Enterprise Top Navigation Header */}
      <PayrollNav />

      {/* Main Content Area */}
      <PayslipList />
    </main>
  );
}

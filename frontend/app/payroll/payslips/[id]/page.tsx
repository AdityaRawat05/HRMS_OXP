import React from "react";
import PayrollNav from "../../../../components/payroll/PayrollNav";
import PayslipDetail from "../../../../components/payroll/PayslipDetail";

export const metadata = {
  title: "Payslip Detail | PeoplePay360",
  description: "Detailed salary computation for one employee",
};

export default function PayslipDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="min-h-screen bg-[#0B1220] text-[#F8FAFC]">
      {/* Enterprise Top Navigation Header */}
      <PayrollNav />

      {/* Main Payslip Detail Area */}
      <PayslipDetail payslipId={params.id} />
    </main>
  );
}

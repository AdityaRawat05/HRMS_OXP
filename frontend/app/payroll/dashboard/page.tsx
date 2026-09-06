"use client";

import React, { Suspense } from "react";
import PayrollDashboard from "../../../components/payroll/dashboard/PayrollDashboard";
import PayrollDashboardSkeleton from "../../../components/payroll/dashboard/PayrollDashboardSkeleton";

export default function PayrollDashboardPage() {
  return (
    <Suspense fallback={<PayrollDashboardSkeleton />}>
      <PayrollDashboard />
    </Suspense>
  );
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * GET /api/payroll/dashboard
 * Complete aggregated backend endpoint for PeoplePay360 Payroll Dashboard.
 */
export async function GET(req: Request) {
  try {
    // 1. Authentication & Permission Verification
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    const canViewDashboard =
      session.isAdmin ||
      session.permissions.some(
        (p) =>
          p.startsWith("payroll:") ||
          p.startsWith("dashboard:") ||
          p.includes("payrun") ||
          p.includes("payslip")
      );

    if (!canViewDashboard) {
      return jsonCorsResponse(
        { success: false, error: "You do not have permission to view the payroll dashboard." },
        { status: 403 },
        req
      );
    }

    // 2. Query Parameter Parsing
    const { searchParams } = new URL(req.url);
    const periodParam = searchParams.get("period");
    const deptParam = searchParams.get("departmentId") || searchParams.get("department_id");
    const empTypeParam = searchParams.get("employeeType") || searchParams.get("employment_type");
    const companyParam = searchParams.get("companyId") || searchParams.get("company_id");

    // 3. Fetch Master Filter Options from Database
    const [allCompanies, allDepartments, allPayrollPeriods] = await Promise.all([
      prisma.companies.findMany({
        where: { is_active: true },
        select: { id: true, name: true, currency_code: true },
        orderBy: { name: "asc" },
      }),
      prisma.departments.findMany({
        where: { is_active: true },
        select: { id: true, name: true, code: true, company_id: true },
        orderBy: { name: "asc" },
      }),
      prisma.payroll_periods.findMany({
        select: {
          id: true,
          company_id: true,
          name: true,
          date_from: true,
          date_to: true,
          state: true,
        },
        orderBy: { date_from: "desc" },
      }),
    ]);

    const employeeTypeOptions = [
      { id: "all", name: "All Types" },
      { id: "full_time", name: "Full Time" },
      { id: "part_time", name: "Part Time" },
      { id: "contractor", name: "Contractor" },
      { id: "intern", name: "Intern" },
      { id: "freelance", name: "Freelance" },
    ];

    // 4. Resolve Active Filter Selections
    let targetCompanyId: number | null = companyParam ? parseInt(companyParam, 10) : null;
    if (!targetCompanyId || isNaN(targetCompanyId)) {
      targetCompanyId = allCompanies.length > 0 ? allCompanies[0].id : null;
    }

    let targetDeptId: number | null = deptParam && deptParam !== "all" ? parseInt(deptParam, 10) : null;
    if (targetDeptId && isNaN(targetDeptId)) targetDeptId = null;

    const targetEmpType = empTypeParam && empTypeParam !== "all" ? empTypeParam : null;

    // Filter payroll periods by selected company if available
    const companyPeriods = targetCompanyId
      ? allPayrollPeriods.filter((p) => p.company_id === targetCompanyId)
      : allPayrollPeriods;
    const periodsList = companyPeriods.length > 0 ? companyPeriods : allPayrollPeriods;

    let targetPeriod = null;
    if (periodParam && periodParam !== "all") {
      if (!isNaN(parseInt(periodParam, 10))) {
        targetPeriod = periodsList.find((p) => p.id === parseInt(periodParam, 10)) || null;
      } else {
        targetPeriod =
          periodsList.find(
            (p) =>
              p.name.includes(periodParam) ||
              p.date_from.toISOString().startsWith(periodParam)
          ) || null;
      }
    }

    if (!targetPeriod && periodsList.length > 0) {
      targetPeriod = periodsList[0]; // default to most recent period
    }

    // Determine Date Range boundaries
    const now = new Date();
    const dateFrom = targetPeriod
      ? new Date(targetPeriod.date_from)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const dateTo = targetPeriod
      ? new Date(targetPeriod.date_to)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 5. Construct Base Prisma Filter Clauses
    const employeeFilter: any = {
      is_active: true,
    };
    if (targetCompanyId) employeeFilter.company_id = targetCompanyId;
    if (targetDeptId) employeeFilter.department_id = targetDeptId;
    if (targetEmpType) employeeFilter.employment_type = targetEmpType;

    const payslipFilter: any = {};
    if (targetPeriod) {
      payslipFilter.payroll_period_id = targetPeriod.id;
    } else {
      payslipFilter.date_from = { gte: dateFrom };
      payslipFilter.date_to = { lte: dateTo };
    }
    if (targetCompanyId) {
      payslipFilter.payruns = { company_id: targetCompanyId };
    }
    if (targetDeptId || targetEmpType) {
      payslipFilter.employees = { ...employeeFilter };
    }

    const attendanceFilter: any = {
      attendance_date: {
        gte: dateFrom,
        lte: dateTo,
      },
    };
    if (targetCompanyId || targetDeptId || targetEmpType) {
      attendanceFilter.employees = { ...employeeFilter };
    }

    const timeOffFilter: any = {
      date_from: { lte: dateTo },
      date_to: { gte: dateFrom },
    };
    if (targetCompanyId || targetDeptId || targetEmpType) {
      timeOffFilter.employees = { ...employeeFilter };
    }

    // 6. Execute Aggregations Parallel Queries
    const [
      filteredEmployees,
      periodPayslips,
      periodPayruns,
      periodWarnings,
      attendanceRecords,
      timeOffRequests,
      timeOffAllocations,
      timeOffTypes,
      recentPayrollPeriods,
      expiringContracts,
    ] = await Promise.all([
      // A. Employees with department info
      prisma.employees.findMany({
        where: employeeFilter,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          department_id: true,
          employment_type: true,
          bank_name: true,
          bank_account_no: true,
          departments_employees_department_idTodepartments: {
            select: { id: true, name: true },
          },
          employee_contracts: {
            where: { state: "active" },
            select: { wage_amount: true, currency_code: true },
            take: 1,
          },
        },
      }),

      // B. Payslips in scope
      prisma.payslips.findMany({
        where: payslipFilter,
        select: {
          id: true,
          employee_id: true,
          net_salary: true,
          gross_salary: true,
          total_deductions: true,
          state: true,
          has_warnings: true,
          payroll_period_id: true,
          employees: {
            select: {
              department_id: true,
              departments_employees_department_idTodepartments: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),

      // C. Payruns in scope
      prisma.payruns.findMany({
        where: {
          ...(targetPeriod ? { payroll_period_id: targetPeriod.id } : {}),
          ...(targetCompanyId ? { company_id: targetCompanyId } : {}),
        },
        select: {
          id: true,
          name: true,
          state: true,
          total_net: true,
          payslip_count: true,
          has_warnings: true,
          warning_count: true,
        },
      }),

      // D. Unresolved Payrun Warnings
      prisma.payrun_warnings.findMany({
        where: {
          is_resolved: false,
          ...(targetPeriod ? { payruns: { payroll_period_id: targetPeriod.id } } : {}),
        },
        select: {
          id: true,
          payrun_id: true,
          warning_type: true,
          severity: true,
          message: true,
          employees: {
            select: { first_name: true, last_name: true },
          },
        },
      }),

      // E. Attendance Records in scope
      prisma.attendance_records.findMany({
        where: attendanceFilter,
        select: {
          id: true,
          status: true,
          is_late: true,
          check_out: true,
          worked_hours: true,
          overtime_hours: true,
          is_manually_corrected: true,
        },
      }),

      // F. Time Off Requests in scope
      prisma.time_off_requests.findMany({
        where: timeOffFilter,
        select: {
          id: true,
          time_off_type_id: true,
          number_of_days: true,
          state: true,
          time_off_types: {
            select: { id: true, name: true, leave_unit: true },
          },
        },
      }),

      // G. Time Off Allocations in scope
      prisma.time_off_allocations.findMany({
        where: {
          state: "approved",
          ...(targetCompanyId || targetDeptId || targetEmpType
            ? { employees: { ...employeeFilter } }
            : {}),
        },
        select: {
          id: true,
          time_off_type_id: true,
          allocated_days: true,
          used_days: true,
          remaining_days: true,
        },
      }),

      // H. Time Off Types
      prisma.time_off_types.findMany({
        where: { is_active: true },
        select: { id: true, name: true, leave_unit: true },
      }),

      // I. Historical Payroll Periods for Monthly Trend Chart (Last 6 periods)
      prisma.payroll_periods.findMany({
        where: targetCompanyId ? { company_id: targetCompanyId } : {},
        orderBy: { date_from: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          date_from: true,
          payslips: {
            select: { net_salary: true, state: true },
          },
        },
      }),

      // J. Expiring Contracts in next 30 days
      prisma.employee_contracts.findMany({
        where: {
          state: "active",
          date_end: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
          ...(targetCompanyId || targetDeptId || targetEmpType
            ? { employees: { ...employeeFilter } }
            : {}),
        },
        select: {
          id: true,
          reference: true,
          date_end: true,
          employees: { select: { first_name: true, last_name: true } },
        },
      }),
    ]);

    // 7. Process KPI 1: Total Net Salary Paid & Overall Net Salary
    let totalNetSalaryPaid = 0;
    let totalNetSalaryAll = 0;
    let paidPayslipCount = 0;
    let pendingPayslipCount = 0;
    let draftPayslipCount = 0;
    let computedPayslipCount = 0;
    let validatedPayslipCount = 0;
    let cancelledPayslipCount = 0;
    let warningPayslipCount = 0;

    periodPayslips.forEach((ps) => {
      const netVal = Number(ps.net_salary) || 0;
      totalNetSalaryAll += netVal;

      if (ps.state === "paid") {
        totalNetSalaryPaid += netVal;
        paidPayslipCount++;
      } else if (ps.state === "draft" || ps.state === "computed" || ps.state === "validated" || ps.state === "sent") {
        pendingPayslipCount++;
        if (ps.state === "draft") draftPayslipCount++;
        if (ps.state === "computed") computedPayslipCount++;
        if (ps.state === "validated") validatedPayslipCount++;
      } else if (ps.state === "cancelled") {
        cancelledPayslipCount++;
      }

      if (ps.has_warnings) warningPayslipCount++;
    });

    const finalNetSalaryPaid = paidPayslipCount > 0 ? totalNetSalaryPaid : totalNetSalaryAll;

    // 8. Process KPI 2 & 3: Payslips Generated & Average Salary
    const totalPayslipsCount = periodPayslips.length;
    const distinctEmployeesCount = new Set(periodPayslips.map((p) => p.employee_id)).size || filteredEmployees.length || 1;
    const averageSalary = Math.round((finalNetSalaryPaid / distinctEmployeesCount) * 100) / 100;

    // 9. Process KPI 4: Approved Time Off Days
    let approvedTimeOffDays = 0;
    let pendingTimeOffCount = 0;

    timeOffRequests.forEach((tor) => {
      const days = Number(tor.number_of_days) || 0;
      if (tor.state === "approved") {
        approvedTimeOffDays += days;
      } else if (tor.state === "submitted" || tor.state === "draft") {
        pendingTimeOffCount++;
      }
    });

    // 10. Process KPI 5: Attendance Health Metrics
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let totalOvertimeHours = 0;
    let missingCheckouts = 0;
    let manualCorrectionsCount = 0;

    attendanceRecords.forEach((att) => {
      const statusStr = String(att.status).toLowerCase();
      if (statusStr === "present") presentCount++;
      if (statusStr === "absent") absentCount++;
      if (att.is_late || statusStr === "late") lateCount++;
      if (att.status === "present" && !att.check_out) missingCheckouts++;
      if (att.is_manually_corrected) manualCorrectionsCount++;
      totalOvertimeHours += Number(att.overtime_hours) || 0;
    });

    const totalAttendanceRecords = attendanceRecords.length;
    const attendanceHealthPct =
      totalAttendanceRecords > 0
        ? Math.round((presentCount / totalAttendanceRecords) * 100 * 10) / 10
        : 100;

    // 11. Process Chart 1: Salary Cost by Department
    const deptSalaryMap: Record<number, { departmentId: number; departmentName: string; salaryCost: number; employeeCount: number }> = {};

    allDepartments.forEach((dept) => {
      if (!targetCompanyId || dept.company_id === targetCompanyId) {
        deptSalaryMap[dept.id] = {
          departmentId: dept.id,
          departmentName: dept.name,
          salaryCost: 0,
          employeeCount: 0,
        };
      }
    });

    filteredEmployees.forEach((emp) => {
      if (emp.department_id && deptSalaryMap[emp.department_id]) {
        deptSalaryMap[emp.department_id].employeeCount++;
      }
    });

    periodPayslips.forEach((ps) => {
      const deptId = ps.employees?.department_id;
      if (deptId && deptSalaryMap[deptId]) {
        deptSalaryMap[deptId].salaryCost += Number(ps.net_salary) || 0;
      }
    });

    const salaryByDepartment = Object.values(deptSalaryMap)
      .map((d) => ({
        ...d,
        salaryCost: Math.round(d.salaryCost * 100) / 100,
      }))
      .sort((a, b) => b.salaryCost - a.salaryCost);

    // 12. Process Chart 2: Monthly Net Salary Trend (Chronological)
    const monthlyNetSalaryTrend = recentPayrollPeriods
      .reverse()
      .map((period) => {
        const netSum = period.payslips.reduce(
          (acc, p) => acc + (Number(p.net_salary) || 0),
          0
        );
        return {
          month: period.name,
          netSalary: Math.round(netSum * 100) / 100,
          payrollPeriodId: period.id,
          dateFrom: period.date_from,
        };
      });

    // 13. Process Chart 3 & Alerts: Payslip Status & Real Payroll Alerts
    const payslipStatus = {
      total: totalPayslipsCount,
      paid: paidPayslipCount,
      pending: pendingPayslipCount,
      draft: draftPayslipCount,
      computed: computedPayslipCount,
      validated: validatedPayslipCount,
      cancelled: cancelledPayslipCount,
      withWarnings: warningPayslipCount,
    };

    const payrollAlerts: Array<{
      id: string;
      type: string;
      severity: "warning" | "error" | "info";
      message: string;
      source: string;
    }> = [];

    periodWarnings.forEach((w) => {
      payrollAlerts.push({
        id: `pw_${w.id}`,
        type: w.warning_type,
        severity: w.severity === "error" ? "error" : "warning",
        message: w.message,
        source: "payrun_warning",
      });
    });

    const employeesMissingBank = filteredEmployees.filter(
      (e) => !e.bank_name || !e.bank_account_no
    );
    if (employeesMissingBank.length > 0) {
      payrollAlerts.push({
        id: "missing_bank_accounts",
        type: "missing_bank_data",
        severity: "warning",
        message: `${employeesMissingBank.length} active employee(s) missing bank account details.`,
        source: "employee_validation",
      });
    }

    const unvalidatedPayruns = periodPayruns.filter(
      (pr) => pr.state === "draft" || pr.state === "computed"
    );
    if (unvalidatedPayruns.length > 0) {
      payrollAlerts.push({
        id: "unvalidated_payruns",
        type: "payrun_pending_validation",
        severity: "info",
        message: `${unvalidatedPayruns.length} payrun(s) pending validation.`,
        source: "payrun_status",
      });
    }

    if (expiringContracts.length > 0) {
      payrollAlerts.push({
        id: "expiring_contracts",
        type: "contract_expiring",
        severity: "warning",
        message: `${expiringContracts.length} employee contract(s) expiring within 30 days.`,
        source: "contract_status",
      });
    }

    // 14. Process Time Off Overview (Grouped by Leave Type)
    const timeOffOverviewMap: Record<
      number,
      { typeId: number; type: string; leaveUnit: string; approvedDays: number; pendingCount: number; remainingBalance: number }
    > = {};

    timeOffTypes.forEach((type) => {
      timeOffOverviewMap[type.id] = {
        typeId: type.id,
        type: type.name,
        leaveUnit: type.leave_unit || "days",
        approvedDays: 0,
        pendingCount: 0,
        remainingBalance: 0,
      };
    });

    timeOffRequests.forEach((tor) => {
      if (timeOffOverviewMap[tor.time_off_type_id]) {
        const days = Number(tor.number_of_days) || 0;
        if (tor.state === "approved") {
          timeOffOverviewMap[tor.time_off_type_id].approvedDays += days;
        } else if (tor.state === "submitted" || tor.state === "draft") {
          timeOffOverviewMap[tor.time_off_type_id].pendingCount++;
        }
      }
    });

    timeOffAllocations.forEach((toa) => {
      if (timeOffOverviewMap[toa.time_off_type_id]) {
        const rem = Number(toa.remaining_days || toa.allocated_days) || 0;
        timeOffOverviewMap[toa.time_off_type_id].remainingBalance += rem;
      }
    });

    const timeOffOverview = Object.values(timeOffOverviewMap).map((t) => ({
      ...t,
      approvedDays: Math.round(t.approvedDays * 10) / 10,
      remainingBalance: Math.round(t.remainingBalance * 10) / 10,
    }));

    // 15. Process Department Overview Table
    const departmentOverview = salaryByDepartment.map((d) => ({
      departmentId: d.departmentId,
      departmentName: d.departmentName,
      headcount: d.employeeCount,
      monthlySalary: d.salaryCost,
    }));

    // 16. Build Final Response Object
    const responsePayload = {
      success: true,
      data: {
        filters: {
          periodOptions: periodsList.map((p) => ({
            id: p.id,
            name: p.name,
            dateFrom: p.date_from,
            dateTo: p.date_to,
            state: p.state,
          })),
          departmentOptions: [
            { id: "all", name: "All Departments" },
            ...allDepartments.map((d) => ({ id: d.id, name: d.name, code: d.code })),
          ],
          employeeTypeOptions,
          companyOptions: allCompanies.map((c) => ({ id: c.id, name: c.name, currency: c.currency_code })),
          activeFilters: {
            periodId: targetPeriod ? targetPeriod.id : null,
            periodName: targetPeriod ? targetPeriod.name : "Current Month",
            departmentId: targetDeptId || "all",
            employeeType: targetEmpType || "all",
            companyId: targetCompanyId,
          },
        },
        kpis: {
          totalNetSalaryPaid: Math.round(finalNetSalaryPaid * 100) / 100,
          formattedNetSalaryPaid: `₹${finalNetSalaryPaid.toLocaleString("en-IN")}`,
          payslipsGenerated: {
            total: totalPayslipsCount,
            paid: paidPayslipCount,
            pending: pendingPayslipCount,
          },
          averageSalary: averageSalary,
          formattedAverageSalary: `₹${averageSalary.toLocaleString("en-IN")}`,
          employeeCountForAverage: distinctEmployeesCount,
          approvedTimeOffDays: Math.round(approvedTimeOffDays * 10) / 10,
          pendingTimeOffCount,
          attendanceHealth: {
            percentage: attendanceHealthPct,
            presentRecords: presentCount,
            lateRecords: lateCount,
            absentRecords: absentCount,
            overtimeHours: Math.round(totalOvertimeHours * 10) / 10,
            missingCheckouts,
            manualCorrections: manualCorrectionsCount,
            totalRecords: totalAttendanceRecords,
          },
        },
        salaryByDepartment,
        monthlyNetSalaryTrend,
        payslipStatus,
        payrollAlerts,
        attendanceOverview: {
          presentCount,
          lateCount,
          absentCount,
          overtimeCount: Math.round(totalOvertimeHours * 10) / 10,
          missingCheckouts,
          attendancePercentage: attendanceHealthPct,
        },
        timeOffOverview,
        departmentOverview,
      },
    };

    return jsonCorsResponse(responsePayload, { status: 200 }, req);
  } catch (error: any) {
    console.error("GET /api/payroll/dashboard error:", error);
    return jsonCorsResponse(
      {
        success: false,
        error: "Internal server error: " + (error?.message || "Unknown error"),
      },
      { status: 500 },
      req
    );
  }
}

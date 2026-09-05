import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Authentication required." }, { status: 401 }, req);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const structureId = searchParams.get("salary_structure_id") ? Number(searchParams.get("salary_structure_id")) : null;
    const periodId = searchParams.get("payroll_period_id") ? Number(searchParams.get("payroll_period_id")) : null;

    let periodFrom: Date | null = null;
    let periodTo: Date | null = null;

    if (periodId) {
      const period = await prisma.payroll_periods.findUnique({ where: { id: periodId } });
      if (period) {
        periodFrom = period.date_from;
        periodTo = period.date_to;
      }
    }

    const employees = await prisma.employees.findMany({
      where: {
        is_active: true,
        deleted_at: null,
        ...(search
          ? {
              OR: [
                { first_name: { contains: search } },
                { last_name: { contains: search } },
                { employee_code: { contains: search } },
                { work_email: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        departments_employees_department_idTodepartments: {
          select: { id: true, name: true },
        },
        job_titles: {
          select: { id: true, name: true },
        },
        employee_contracts: {
          where: {
            state: { in: ["active", "draft"] },
            ...(structureId ? { salary_structure_id: structureId } : {}),
          },
          include: {
            salary_structures: { select: { id: true, name: true } },
            working_schedules: { select: { id: true, total_weekly_hours: true } },
          },
          orderBy: { date_start: "desc" },
          take: 1,
        },
      },
      orderBy: { employee_code: "asc" },
    });

    const formattedEmployees = employees.map((emp) => {
      const activeContract = emp.employee_contracts[0] || null;
      return {
        id: emp.id,
        employee_code: emp.employee_code,
        first_name: emp.first_name,
        last_name: emp.last_name,
        name: `${emp.first_name} ${emp.last_name}`.trim(),
        work_email: emp.work_email,
        bank_name: emp.bank_name || null,
        bank_account_no: emp.bank_account_no || null,
        bank_ifsc_code: emp.bank_ifsc_code || null,
        bank_branch: emp.bank_branch || null,
        department: emp.departments_employees_department_idTodepartments?.name || "N/A",
        job_title: emp.job_titles?.name || "N/A",
        contract_id: activeContract?.id || null,
        contract_reference: activeContract?.reference || null,
        wage_amount: activeContract?.wage_amount ? activeContract.wage_amount.toString() : "0.00",
        wage_type: activeContract?.wage_type || "monthly",
        working_hours: activeContract?.working_schedules?.total_weekly_hours
          ? activeContract.working_schedules.total_weekly_hours.toString()
          : "40.00",
        hire_date: emp.hire_date.toISOString().split("T")[0],
        salary_structure_id: activeContract?.salary_structures?.id || null,
        salary_structure_name: activeContract?.salary_structures?.name || "Standard Structure",
      };
    });

    return jsonCorsResponse({
      success: true,
      data: {
        employees: formattedEmployees,
        count: formattedEmployees.length,
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("GET /api/payruns/eligible-employees error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to fetch eligible employees." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

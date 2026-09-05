import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
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
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : null;
    const state = searchParams.get("state")?.trim().toLowerCase() || "";

    const payruns = await prisma.payruns.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search } },
                  { reference: { contains: search } },
                  { payroll_periods: { name: { contains: search } } },
                ],
              }
            : {},
          state ? { state: state as any } : {},
          year
            ? {
                payroll_periods: {
                  OR: [
                    { date_from: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
                    { date_to: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
                  ],
                },
              }
            : {},
        ],
      },
      include: {
        companies: { select: { id: true, name: true } },
        payroll_periods: { select: { id: true, name: true, date_from: true, date_to: true, state: true } },
        salary_structures: { select: { id: true, name: true, code: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const formattedPayruns = payruns.map((pr) => ({
      id: pr.id,
      company_id: pr.company_id,
      company_name: pr.companies.name,
      payroll_period_id: pr.payroll_period_id,
      period_name: pr.payroll_periods.name,
      date_from: pr.payroll_periods.date_from.toISOString().split("T")[0],
      date_to: pr.payroll_periods.date_to.toISOString().split("T")[0],
      salary_structure_id: pr.salary_structure_id,
      salary_structure_name: pr.salary_structures.name,
      name: pr.name,
      reference: pr.reference,
      state: pr.state,
      total_gross: pr.total_gross.toString(),
      total_deductions: pr.total_deductions.toString(),
      total_net: pr.total_net.toString(),
      payslip_count: pr.payslip_count,
      has_warnings: pr.has_warnings,
      warning_count: pr.warning_count,
      computed_at: pr.computed_at,
      validated_at: pr.validated_at,
      paid_at: pr.paid_at,
      sent_at: pr.sent_at,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
    }));

    return jsonCorsResponse({
      success: true,
      data: { payruns: formattedPayruns, count: formattedPayruns.length },
    }, undefined, req);
  } catch (error: any) {
    console.error("GET /api/payruns error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to fetch payruns." }, { status: 500 }, req);
  }
}

export async function POST(req: Request) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid JSON body." }, { status: 400 }, req);
    }

    const { payroll_period_id, salary_structure_id, name, employee_ids, company_id } = body || {};

    if (!payroll_period_id || isNaN(Number(payroll_period_id))) {
      return jsonCorsResponse({ success: false, error: "payroll_period_id is required." }, { status: 400 }, req);
    }

    if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
      return jsonCorsResponse({ success: false, error: "At least one employee must be selected for the payrun." }, { status: 400 }, req);
    }

    // Verify payroll period exists
    const period = await prisma.payroll_periods.findUnique({
      where: { id: Number(payroll_period_id) },
    });
    if (!period) {
      return jsonCorsResponse({ success: false, error: "Selected payroll period does not exist." }, { status: 404 }, req);
    }
    if (period.state === "locked") {
      return jsonCorsResponse({ success: false, error: "Cannot create payrun for a locked payroll period." }, { status: 422 }, req);
    }

    const resolvedCompanyId = company_id ? Number(company_id) : period.company_id;

    // Verify or auto-create default salary structure
    let structure = null;
    if (salary_structure_id) {
      structure = await prisma.salary_structures.findUnique({
        where: { id: Number(salary_structure_id) },
      });
    }
    if (!structure) {
      structure = await prisma.salary_structures.findFirst({ where: { is_active: true } });
    }
    if (!structure) {
      structure = await prisma.salary_structures.create({
        data: {
          company_id: resolvedCompanyId,
          name: "Standard Indian Payroll Structure",
          code: "STD_INDIAN_PAYROLL",
          description: "Standard structure containing Basic, HRA, Allowances, PF, ESIC, PT, Gross & Net rules.",
          is_active: true,
          salary_rules: {
            create: [
              { category_id: 1, name: "Basic Salary", code: "BASIC", sequence: 10, calculation_type: "percentage", percentage: 50.0, percentage_based_on: "WAGE" },
              { category_id: 2, name: "House Rent Allowance", code: "HRA", sequence: 20, calculation_type: "percentage", percentage: 40.0, percentage_based_on: "BASIC" },
              { category_id: 2, name: "Standard Allowance", code: "STD", sequence: 30, calculation_type: "fixed", fixed_amount: 4167.0 },
              { category_id: 3, name: "Gross Salary", code: "GROSS", sequence: 50, calculation_type: "formula", formula: "BASIC + HRA + STD" },
              { category_id: 4, name: "Provident Fund", code: "PF", sequence: 60, calculation_type: "percentage", percentage: 12.0, percentage_based_on: "BASIC" },
              { category_id: 4, name: "Professional Tax", code: "PT", sequence: 80, calculation_type: "fixed", fixed_amount: 200.0 },
              { category_id: 5, name: "Net Salary", code: "NET", sequence: 90, calculation_type: "formula", formula: "GROSS - PF - PT" },
            ],
          },
        },
      });
    }

    // Load contracts for selected employee IDs
    const numericEmpIds = employee_ids.map((id: any) => Number(id));
    const employeesWithContracts = await prisma.employees.findMany({
      where: {
        id: { in: numericEmpIds },
        is_active: true,
        deleted_at: null,
      },
      include: {
        employee_contracts: {
          where: {
            state: { in: ["active", "draft"] },
          },
          orderBy: { date_start: "desc" },
          take: 1,
        },
      },
    });

    if (employeesWithContracts.length === 0) {
      return jsonCorsResponse({ success: false, error: "None of the selected employees have valid contracts." }, { status: 422 }, req);
    }

    const payrunName = (name && typeof name === "string" && name.trim())
      ? name.trim()
      : `${period.name} Payrun`;

    const reference = `PR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    // Perform atomic transaction: create payrun + draft payslips for ONLY selected employees
    const createdPayrun = await prisma.$transaction(async (tx) => {
      const payrun = await tx.payruns.create({
        data: {
          company_id: resolvedCompanyId,
          payroll_period_id: period.id,
          salary_structure_id: structure.id,
          name: payrunName,
          reference,
          state: "draft",
          payslip_count: employeesWithContracts.length,
          created_by: authCheck.sessionData.user.id,
        },
      });

      for (const emp of employeesWithContracts) {
        let contract = emp.employee_contracts[0];
        if (!contract) {
          contract = await tx.employee_contracts.create({
            data: {
              employee_id: emp.id,
              reference: `CON-${new Date().getFullYear()}-${emp.id.toString().padStart(3, "0")}-01`,
              wage_type: "monthly",
              wage_amount: 0,
              salary_structure_id: structure.id,
              date_start: period.date_from,
              state: "active",
            },
          });
        }

        const psRef = `PS-${payrun.id}-${emp.id}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        await tx.payslips.create({
          data: {
            payrun_id: payrun.id,
            employee_id: emp.id,
            contract_id: contract.id,
            payroll_period_id: period.id,
            reference: psRef,
            date_from: period.date_from,
            date_to: period.date_to,
            basic_salary: contract.wage_amount,
            gross_salary: contract.wage_amount,
            net_salary: contract.wage_amount,
            state: "draft",
          },
        });
      }

      return payrun;
    });

    return jsonCorsResponse({
      success: true,
      data: {
        payrun: {
          id: createdPayrun.id,
          name: createdPayrun.name,
          reference: createdPayrun.reference,
          state: createdPayrun.state,
          payslip_count: createdPayrun.payslip_count,
          created_at: createdPayrun.created_at,
        },
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("POST /api/payruns error:", error);
    if (error.code === "P2002") {
      return jsonCorsResponse({ success: false, error: "A payrun with this reference already exists." }, { status: 409 }, req);
    }
    return jsonCorsResponse({ success: false, error: "Failed to create payrun." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

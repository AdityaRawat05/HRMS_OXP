import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Authentication required." }, { status: 401 }, req);
    }

    const id = Number(params.id);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid payrun ID." }, { status: 400 }, req);
    }

    const payrun = await prisma.payruns.findUnique({
      where: { id },
      include: {
        companies: { select: { id: true, name: true, currency_code: true } },
        payroll_periods: {
          select: {
            id: true,
            name: true,
            date_from: true,
            date_to: true,
            state: true,
          },
        },
        salary_structures: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
        payrun_warnings: {
          include: {
            employees: {
              select: { id: true, first_name: true, last_name: true, employee_code: true },
            },
          },
          orderBy: { created_at: "desc" },
        },
        payslips: {
          include: {
            employees: {
              select: {
                id: true,
                employee_code: true,
                first_name: true,
                last_name: true,
                work_email: true,
                bank_name: true,
                bank_account_no: true,
                pan_number: true,
              },
            },
            employee_contracts: {
              select: {
                id: true,
                reference: true,
                wage_amount: true,
                wage_type: true,
              },
            },
            payslip_lines: {
              orderBy: { sequence: "asc" },
            },
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!payrun) {
      return jsonCorsResponse({ success: false, error: "Payrun not found." }, { status: 404 }, req);
    }

    const formattedPayslips = payrun.payslips.map((ps) => ({
      id: ps.id.toString(),
      reference: ps.reference,
      employee_id: ps.employee_id,
      employee_code: ps.employees.employee_code,
      employee_name: `${ps.employees.first_name} ${ps.employees.last_name}`.trim(),
      work_email: ps.employees.work_email,
      bank_account_no: ps.employees.bank_account_no,
      contract_reference: ps.employee_contracts?.reference || "N/A",
      basic_salary: ps.basic_salary.toString(),
      gross_salary: ps.gross_salary.toString(),
      total_deductions: ps.total_deductions.toString(),
      net_salary: ps.net_salary.toString(),
      days_worked: ps.days_worked.toString(),
      leave_days_taken: ps.leave_days_taken.toString(),
      overtime_hours: ps.overtime_hours.toString(),
      state: ps.state,
      has_warnings: ps.has_warnings,
      pdf_url: ps.pdf_url,
      lines: ps.payslip_lines.map((l) => ({
        id: l.id.toString(),
        salary_rule_id: l.salary_rule_id,
        category_id: l.category_id,
        name: l.name,
        code: l.code,
        sequence: l.sequence,
        calculation_type: l.calculation_type,
        rate: l.rate.toString(),
        base_amount: l.base_amount.toString(),
        amount: l.amount.toString(),
        is_contribution: l.is_contribution,
        appears_on_payslip: l.appears_on_payslip,
      })),
    }));

    const formattedWarnings = payrun.payrun_warnings.map((w) => ({
      id: w.id.toString(),
      payrun_id: w.payrun_id,
      payslip_id: w.payslip_id ? w.payslip_id.toString() : null,
      employee_id: w.employee_id,
      employee_name: w.employees ? `${w.employees.first_name} ${w.employees.last_name}`.trim() : null,
      employee_code: w.employees?.employee_code || null,
      warning_type: w.warning_type,
      severity: w.severity,
      message: w.message,
      is_resolved: w.is_resolved,
      created_at: w.created_at,
    }));

    return jsonCorsResponse({
      success: true,
      data: {
        payrun: {
          id: payrun.id,
          company_id: payrun.company_id,
          company_name: payrun.companies.name,
          currency_code: payrun.companies.currency_code,
          payroll_period_id: payrun.payroll_period_id,
          period_name: payrun.payroll_periods.name,
          date_from: payrun.payroll_periods.date_from.toISOString().split("T")[0],
          date_to: payrun.payroll_periods.date_to.toISOString().split("T")[0],
          period_state: payrun.payroll_periods.state,
          salary_structure_id: payrun.salary_structure_id,
          salary_structure_name: payrun.salary_structures.name,
          name: payrun.name,
          reference: payrun.reference,
          state: payrun.state,
          total_gross: payrun.total_gross.toString(),
          total_deductions: payrun.total_deductions.toString(),
          total_net: payrun.total_net.toString(),
          payslip_count: payrun.payslip_count,
          has_warnings: payrun.has_warnings,
          warning_count: payrun.warning_count,
          computed_at: payrun.computed_at,
          validated_at: payrun.validated_at,
          paid_at: payrun.paid_at,
          sent_at: payrun.sent_at,
          created_at: payrun.created_at,
          updated_at: payrun.updated_at,
          warnings: formattedWarnings,
          payslips: formattedPayslips,
        },
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("GET /api/payruns/[id] error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to fetch payrun details." }, { status: 500 }, req);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const id = Number(params.id);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid payrun ID." }, { status: 400 }, req);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid JSON body." }, { status: 400 }, req);
    }

    const { name, reference } = body || {};

    const existing = await prisma.payruns.findUnique({ where: { id } });
    if (!existing) {
      return jsonCorsResponse({ success: false, error: "Payrun not found." }, { status: 404 }, req);
    }

    if (existing.state !== "draft") {
      return jsonCorsResponse({ success: false, error: "Only draft payruns can be edited." }, { status: 422 }, req);
    }

    const updateData: any = {};
    if (name && typeof name === "string" && name.trim()) updateData.name = name.trim();
    if (reference && typeof reference === "string" && reference.trim()) updateData.reference = reference.trim();

    const updated = await prisma.payruns.update({
      where: { id },
      data: updateData,
    });

    return jsonCorsResponse({
      success: true,
      data: {
        payrun: {
          id: updated.id,
          name: updated.name,
          reference: updated.reference,
          state: updated.state,
          updated_at: updated.updated_at,
        },
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("PATCH /api/payruns/[id] error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to update payrun." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

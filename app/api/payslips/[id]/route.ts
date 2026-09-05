import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Authentication required." }, { status: 401 }, req);
    }

    const payslipIdRaw = params.id;
    if (!payslipIdRaw) {
      return jsonCorsResponse({ success: false, error: "Payslip ID is required." }, { status: 400 }, req);
    }

    let payslipIdBigInt: bigint;
    try {
      payslipIdBigInt = BigInt(payslipIdRaw);
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid payslip ID format." }, { status: 400 }, req);
    }

    const rawPayslip = await prisma.payslips.findFirst({
      where: { id: payslipIdBigInt },
      include: {
        employees: {
          select: {
            id: true,
            user_id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
            work_email: true,
            personal_email: true,
            phone: true,
            bank_name: true,
            bank_account_no: true,
            bank_ifsc_code: true,
            pan_number: true,
            aadhaar_number: true,
            uan_number: true,
            esi_number: true,
            departments_employees_department_idTodepartments: { select: { id: true, name: true } },
            job_positions: { select: { id: true, title: true } },
            job_titles: { select: { id: true, name: true } },
          },
        },
        employee_contracts: {
          include: {
            salary_structures: { select: { id: true, name: true, code: true } },
            working_schedules: { select: { id: true, total_weekly_hours: true } },
          },
        },
        payroll_periods: {
          select: { id: true, name: true, date_from: true, date_to: true, state: true },
        },
        payruns: {
          select: {
            id: true,
            name: true,
            reference: true,
            state: true,
            salary_structures: { select: { id: true, name: true, code: true } },
          },
        },
        payslip_lines: {
          include: {
            salary_rule_categories: { select: { id: true, name: true, code: true, sequence: true } },
            salary_rules: { select: { id: true, name: true, code: true, sequence: true } },
          },
          orderBy: { sequence: "asc" },
        },
        payrun_warnings: {
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!rawPayslip) {
      return jsonCorsResponse({ success: false, error: "Payslip not found." }, { status: 404 }, req);
    }

    const payslip: any = rawPayslip;

    // RBAC Check: Employees can only view their own payslips
    const isHrOrAdmin = session.roles.some((r: any) => ["admin", "hr_manager", "payroll_manager"].includes(r.name));
    if (!isHrOrAdmin && payslip.employees?.user_id !== session.user.id) {
      return jsonCorsResponse({ success: false, error: "Access denied. You can only view your own payslips." }, { status: 403 }, req);
    }

    const formattedLines = (payslip.payslip_lines || []).map((line: any) => ({
      id: line.id.toString(),
      payslip_id: line.payslip_id.toString(),
      salary_rule_id: line.salary_rule_id,
      category_id: line.category_id,
      category_code: line.salary_rule_categories?.code || "",
      category_name: line.salary_rule_categories?.name || "",
      name: line.name,
      code: line.code,
      sequence: line.sequence,
      calculation_type: line.calculation_type,
      rate: line.rate.toString(),
      base_amount: line.base_amount.toString(),
      amount: line.amount.toString(),
      is_contribution: line.is_contribution,
      appears_on_payslip: line.appears_on_payslip,
    }));

    const formattedWarnings = (payslip.payrun_warnings || []).map((w: any) => ({
      id: w.id ? w.id.toString() : "",
      payrun_id: w.payrun_id,
      employee_id: w.employee_id,
      payslip_id: w.payslip_id ? w.payslip_id.toString() : null,
      warning_type: w.warning_type,
      severity: w.severity,
      message: w.message,
      is_resolved: w.is_resolved,
      created_at: w.created_at,
    }));

    const contract = payslip.employee_contracts;
    const emp = payslip.employees || {};
    const period = payslip.payroll_periods || {};
    const payrun = payslip.payruns || {};

    const formattedPayslip = {
      id: payslip.id.toString(),
      payrun_id: payslip.payrun_id,
      payrun_name: payrun.name || "",
      payrun_reference: payrun.reference || "",
      payrun_state: payrun.state || "",
      employee_id: payslip.employee_id,
      employee_code: emp.employee_code || "",
      employee_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim(),
      employee_email: emp.work_email || null,
      personal_email: emp.personal_email || null,
      phone: emp.phone || null,
      department_name: emp.departments_employees_department_idTodepartments?.name || "N/A",
      job_position: emp.job_positions?.title || "N/A",
      job_title: emp.job_titles?.name || "N/A",
      bank_name: emp.bank_name || "-",
      bank_account_no: emp.bank_account_no || "-",
      bank_ifsc_code: emp.bank_ifsc_code || "-",
      pan_number: emp.pan_number || "-",
      aadhaar_number: emp.aadhaar_number || "-",
      uan_number: emp.uan_number || "-",
      esi_number: emp.esi_number || "-",
      contract_id: payslip.contract_id,
      contract_reference: contract ? contract.reference : null,
      wage_type: contract ? contract.wage_type : "monthly",
      wage_amount: contract ? contract.wage_amount.toString() : "0.00",
      payroll_period_id: payslip.payroll_period_id,
      period_name: period.name || "",
      period_date_from: period.date_from ? period.date_from.toISOString().split("T")[0] : "",
      period_date_to: period.date_to ? period.date_to.toISOString().split("T")[0] : "",
      salary_structure_id: contract?.salary_structures?.id || payrun.salary_structures?.id,
      salary_structure_name: contract?.salary_structures?.name || payrun.salary_structures?.name || "Standard Structure",
      reference: payslip.reference,
      date_from: payslip.date_from ? payslip.date_from.toISOString().split("T")[0] : "",
      date_to: payslip.date_to ? payslip.date_to.toISOString().split("T")[0] : "",
      basic_salary: payslip.basic_salary.toString(),
      gross_salary: payslip.gross_salary.toString(),
      total_deductions: payslip.total_deductions.toString(),
      net_salary: payslip.net_salary.toString(),
      total_working_days: payslip.total_working_days.toString(),
      days_worked: payslip.days_worked.toString(),
      days_absent: payslip.days_absent.toString(),
      leave_days_taken: payslip.leave_days_taken.toString(),
      overtime_hours: payslip.overtime_hours.toString(),
      state: payslip.state,
      has_warnings: payslip.has_warnings || formattedWarnings.length > 0,
      warning_count: formattedWarnings.length,
      pdf_url: payslip.pdf_url,
      pdf_generated_at: payslip.pdf_generated_at,
      email_sent: payslip.email_sent,
      email_sent_at: payslip.email_sent_at,
      email_to: payslip.email_to,
      created_at: payslip.created_at,
      updated_at: payslip.updated_at,
      lines: formattedLines,
      warnings: formattedWarnings,
    };

    return jsonCorsResponse({
      success: true,
      data: { payslip: formattedPayslip },
    }, undefined, req);
  } catch (error: any) {
    console.error("GET /api/payslips/[id] error stack:", error.stack || error);
    return jsonCorsResponse({ success: false, error: "Failed to fetch payslip details." }, { status: 500 }, req);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const payslipIdRaw = params.id;
    let payslipIdBigInt: bigint;
    try {
      payslipIdBigInt = BigInt(payslipIdRaw);
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid payslip ID format." }, { status: 400 }, req);
    }

    const payslip = await prisma.payslips.findFirst({
      where: { id: payslipIdBigInt },
    });

    if (!payslip) {
      return jsonCorsResponse({ success: false, error: "Payslip not found." }, { status: 404 }, req);
    }

    if (payslip.state !== "draft" && payslip.state !== "computed") {
      return jsonCorsResponse({ success: false, error: "Cannot edit attendance/days for a validated or paid payslip." }, { status: 422 }, req);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid JSON body." }, { status: 400 }, req);
    }

    const { days_worked, days_absent, leave_days_taken, overtime_hours } = body || {};

    const updateData: any = {};
    if (days_worked !== undefined) updateData.days_worked = Number(days_worked);
    if (days_absent !== undefined) updateData.days_absent = Number(days_absent);
    if (leave_days_taken !== undefined) updateData.leave_days_taken = Number(leave_days_taken);
    if (overtime_hours !== undefined) updateData.overtime_hours = Number(overtime_hours);

    const updatedPayslip = await prisma.payslips.update({
      where: { id: payslipIdBigInt },
      data: updateData,
    });

    return jsonCorsResponse({
      success: true,
      data: {
        payslip: {
          id: updatedPayslip.id.toString(),
          days_worked: updatedPayslip.days_worked.toString(),
          days_absent: updatedPayslip.days_absent.toString(),
          leave_days_taken: updatedPayslip.leave_days_taken.toString(),
          overtime_hours: updatedPayslip.overtime_hours.toString(),
          state: updatedPayslip.state,
        },
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("PATCH /api/payslips/[id] error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to update payslip." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

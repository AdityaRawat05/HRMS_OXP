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
    const payrunId = searchParams.get("payrun_id") ? Number(searchParams.get("payrun_id")) : null;
    const periodId = searchParams.get("payroll_period_id") ? Number(searchParams.get("payroll_period_id")) : null;
    const reqEmpId = searchParams.get("employee_id") ? Number(searchParams.get("employee_id")) : null;
    const state = searchParams.get("state")?.trim().toLowerCase() || "";
    const page = Math.max(1, searchParams.get("page") ? Number(searchParams.get("page")) : 1);
    const limit = Math.max(1, Math.min(100, searchParams.get("limit") ? Number(searchParams.get("limit")) : 50));
    const skip = (page - 1) * limit;

    // Check RBAC permissions
    const isHrOrAdmin = session.roles.some((r) => ["admin", "hr_manager", "payroll_manager"].includes(r.name));
    
    // Determine effective employee filtering
    let targetEmployeeId = reqEmpId;
    if (!isHrOrAdmin) {
      // Non-admin users can ONLY view their own payslips
      const linkedEmployee = await prisma.employees.findFirst({
        where: { user_id: session.user.id },
        select: { id: true },
      });
      if (!linkedEmployee) {
        return jsonCorsResponse({ success: true, data: { payslips: [], total: 0, page, limit } }, undefined, req);
      }
      targetEmployeeId = linkedEmployee.id;
    }

    // Build database WHERE condition
    const whereCondition: any = {
      AND: [
        payrunId ? { payrun_id: payrunId } : {},
        periodId ? { payroll_period_id: periodId } : {},
        targetEmployeeId ? { employee_id: targetEmployeeId } : {},
        state && state !== "all" ? { state: state as any } : {},
        search
          ? {
              OR: [
                { reference: { contains: search } },
                { employees: { first_name: { contains: search } } },
                { employees: { last_name: { contains: search } } },
                { employees: { employee_code: { contains: search } } },
                { employees: { work_email: { contains: search } } },
              ],
            }
          : {},
      ],
    };

    // Execute paginated count and findMany queries
    const [total, payslips] = await Promise.all([
      prisma.payslips.count({ where: whereCondition }),
      prisma.payslips.findMany({
        where: whereCondition,
        include: {
          employees: {
            select: {
              id: true,
              employee_code: true,
              first_name: true,
              last_name: true,
              work_email: true,
              departments_employees_department_idTodepartments: { select: { id: true, name: true } },
              job_titles: { select: { id: true, name: true } },
            },
          },
          payroll_periods: {
            select: { id: true, name: true, date_from: true, date_to: true },
          },
          payruns: {
            select: {
              id: true,
              name: true,
              reference: true,
              salary_structures: { select: { id: true, name: true, code: true } },
            },
          },
          _count: {
            select: { payrun_warnings: true, payslip_lines: true },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formattedPayslips = payslips.map((ps) => ({
      id: ps.id.toString(),
      payrun_id: ps.payrun_id,
      payrun_name: ps.payruns.name,
      payrun_reference: ps.payruns.reference,
      employee_id: ps.employee_id,
      employee_code: ps.employees.employee_code,
      employee_name: `${ps.employees.first_name} ${ps.employees.last_name}`.trim(),
      employee_email: ps.employees.work_email,
      department_name: ps.employees.departments_employees_department_idTodepartments?.name || "N/A",
      job_title: ps.employees.job_titles?.name || "N/A",
      contract_id: ps.contract_id,
      payroll_period_id: ps.payroll_period_id,
      period_name: ps.payroll_periods.name,
      period_date_from: ps.payroll_periods.date_from.toISOString().split("T")[0],
      period_date_to: ps.payroll_periods.date_to.toISOString().split("T")[0],
      salary_structure_name: ps.payruns.salary_structures.name,
      reference: ps.reference,
      date_from: ps.date_from.toISOString().split("T")[0],
      date_to: ps.date_to.toISOString().split("T")[0],
      basic_salary: ps.basic_salary.toString(),
      gross_salary: ps.gross_salary.toString(),
      total_deductions: ps.total_deductions.toString(),
      net_salary: ps.net_salary.toString(),
      total_working_days: ps.total_working_days.toString(),
      days_worked: ps.days_worked.toString(),
      days_absent: ps.days_absent.toString(),
      leave_days_taken: ps.leave_days_taken.toString(),
      overtime_hours: ps.overtime_hours.toString(),
      state: ps.state,
      has_warnings: ps.has_warnings || ps._count.payrun_warnings > 0,
      warning_count: ps._count.payrun_warnings,
      pdf_url: ps.pdf_url,
      pdf_generated_at: ps.pdf_generated_at,
      email_sent: ps.email_sent,
      email_sent_at: ps.email_sent_at,
      created_at: ps.created_at,
      updated_at: ps.updated_at,
    }));

    return jsonCorsResponse({
      success: true,
      data: {
        payslips: formattedPayslips,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("GET /api/payslips error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to fetch payslips." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

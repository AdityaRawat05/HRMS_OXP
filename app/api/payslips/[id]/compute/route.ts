import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

    const payslip = await prisma.payslips.findUnique({
      where: { id: payslipIdBigInt },
      include: {
        employees: true,
        employee_contracts: true,
        payruns: {
          include: {
            salary_structures: {
              include: {
                salary_rules: {
                  where: { is_active: true },
                  orderBy: { sequence: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!payslip) {
      return jsonCorsResponse({ success: false, error: "Payslip not found." }, { status: 404 }, req);
    }

    if (payslip.state === "validated" || payslip.state === "paid" || payslip.state === "sent") {
      return jsonCorsResponse({ success: false, error: "Cannot re-compute a validated, paid, or sent payslip." }, { status: 422 }, req);
    }

    const contract = payslip.employee_contracts;
    const baseWage = contract ? Number(contract.wage_amount) : Number(payslip.basic_salary || 0);

    // Working days & attendance calculation
    const totalWorkingDays = Number(payslip.total_working_days) > 0 ? Number(payslip.total_working_days) : 26.0;
    const daysWorked = Number(payslip.days_worked) > 0 ? Number(payslip.days_worked) : totalWorkingDays;
    const attendanceFactor = totalWorkingDays > 0 ? Math.min(1.0, daysWorked / totalWorkingDays) : 1.0;

    // Financial calculations using rules
    const basicSalary = Math.round(baseWage * 0.50 * attendanceFactor * 100) / 100;
    const hraAmount = Math.round(basicSalary * 0.40 * 100) / 100;
    const stdAllowance = Math.round(4167.0 * attendanceFactor * 100) / 100;
    const grossSalary = Math.round((basicSalary + hraAmount + stdAllowance) * 100) / 100;

    const pfDeduction = Math.round(basicSalary * 0.12 * 100) / 100;
    const ptDeduction = grossSalary > 15000 ? 200.0 : 0.0;
    const totalDeductions = Math.round((pfDeduction + ptDeduction) * 100) / 100;
    const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

    // Salary rules breakdown
    const lineDefinitions = [
      { category_id: 1, name: "Basic Salary", code: "BASIC", sequence: 10, type: "fixed" as const, base: baseWage, rate: 50.0, amount: basicSalary },
      { category_id: 2, name: "House Rent Allowance", code: "HRA", sequence: 20, type: "percentage" as const, base: basicSalary, rate: 40.0, amount: hraAmount },
      { category_id: 2, name: "Standard Allowance", code: "STD", sequence: 30, type: "fixed" as const, base: 4167.0, rate: 100.0, amount: stdAllowance },
      { category_id: 3, name: "Gross Salary", code: "GROSS", sequence: 50, type: "formula" as const, base: grossSalary, rate: 100.0, amount: grossSalary },
      { category_id: 4, name: "Provident Fund", code: "PF", sequence: 60, type: "percentage" as const, base: basicSalary, rate: 12.0, amount: pfDeduction },
      { category_id: 4, name: "Professional Tax", code: "PT", sequence: 80, type: "fixed" as const, base: ptDeduction, rate: 100.0, amount: ptDeduction },
      { category_id: 5, name: "Net Salary", code: "NET", sequence: 90, type: "formula" as const, base: netSalary, rate: 100.0, amount: netSalary },
    ];

    // Atomically replace payslip_lines and update payslip totals
    const updatedPayslip = await prisma.$transaction(async (tx) => {
      // Delete existing lines
      await tx.payslip_lines.deleteMany({
        where: { payslip_id: payslipIdBigInt },
      });

      // Insert fresh lines
      for (const lineDef of lineDefinitions) {
        await tx.payslip_lines.create({
          data: {
            payslip_id: payslipIdBigInt,
            salary_rule_id: lineDef.category_id,
            category_id: lineDef.category_id,
            name: lineDef.name,
            code: lineDef.code,
            sequence: lineDef.sequence,
            calculation_type: lineDef.type,
            rate: new Prisma.Decimal(lineDef.rate),
            base_amount: new Prisma.Decimal(lineDef.base),
            amount: new Prisma.Decimal(lineDef.amount),
            appears_on_payslip: true,
          },
        });
      }

      // Update payslip record
      return await tx.payslips.update({
        where: { id: payslipIdBigInt },
        data: {
          basic_salary: new Prisma.Decimal(basicSalary),
          gross_salary: new Prisma.Decimal(grossSalary),
          total_deductions: new Prisma.Decimal(totalDeductions),
          net_salary: new Prisma.Decimal(netSalary),
          total_working_days: new Prisma.Decimal(totalWorkingDays),
          days_worked: new Prisma.Decimal(daysWorked),
          state: "computed",
        },
      });
    });

    return jsonCorsResponse({
      success: true,
      data: {
        payslip: {
          id: updatedPayslip.id.toString(),
          basic_salary: updatedPayslip.basic_salary.toString(),
          gross_salary: updatedPayslip.gross_salary.toString(),
          total_deductions: updatedPayslip.total_deductions.toString(),
          net_salary: updatedPayslip.net_salary.toString(),
          state: updatedPayslip.state,
        },
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("POST /api/payslips/[id]/compute error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to compute payslip." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

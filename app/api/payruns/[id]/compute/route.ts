import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const payrunId = Number(params.id);
    if (isNaN(payrunId)) {
      return jsonCorsResponse({ success: false, error: "Invalid payrun ID." }, { status: 400 }, req);
    }

    // Load Payrun with related data
    const payrun = await prisma.payruns.findUnique({
      where: { id: payrunId },
      include: {
        payroll_periods: true,
        salary_structures: {
          include: {
            salary_rules: {
              where: { is_active: true },
              include: { salary_rule_categories: true },
              orderBy: { sequence: "asc" },
            },
          },
        },
        payslips: {
          include: {
            employees: {
              include: {
                employee_contracts: {
                  where: { state: { in: ["active", "draft"] } },
                  orderBy: { date_start: "desc" },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!payrun) {
      return jsonCorsResponse({ success: false, error: "Payrun not found." }, { status: 404 }, req);
    }

    if (payrun.state === "paid" || payrun.state === "sent" || payrun.state === "cancelled") {
      return jsonCorsResponse({ success: false, error: `Cannot re-compute payrun in '${payrun.state}' state.` }, { status: 422 }, req);
    }

    const period = payrun.payroll_periods;
    const rules = payrun.salary_structures.salary_rules;

    let totalPayrunGross = new Prisma.Decimal(0);
    let totalPayrunDeductions = new Prisma.Decimal(0);
    let totalPayrunNet = new Prisma.Decimal(0);
    let totalWarningCount = 0;

    // Execute entire compute operation in a single Prisma transaction
    await prisma.$transaction(async (tx) => {
      // Clear existing warnings for this payrun
      await tx.payrun_warnings.deleteMany({
        where: { payrun_id: payrunId },
      });

      for (const payslip of payrun.payslips) {
        const employee = payslip.employees;
        const contract = employee.employee_contracts[0] || null;

        // Clear existing payslip lines
        await tx.payslip_lines.deleteMany({
          where: { payslip_id: payslip.id },
        });

        let empHasWarning = false;

        // Check for Contract warnings
        if (!contract) {
          empHasWarning = true;
          totalWarningCount++;
          await tx.payrun_warnings.create({
            data: {
              payrun_id: payrunId,
              payslip_id: payslip.id,
              employee_id: employee.id,
              warning_type: "no_active_contract",
              severity: "error",
              message: `Employee ${employee.first_name} ${employee.last_name} (${employee.employee_code}) has no active salary contract.`,
            },
          });
        }

        // Check for Missing Bank Account details
        if (!employee.bank_account_no || !employee.bank_name) {
          empHasWarning = true;
          totalWarningCount++;
          await tx.payrun_warnings.create({
            data: {
              payrun_id: payrunId,
              payslip_id: payslip.id,
              employee_id: employee.id,
              warning_type: "missing_bank_account",
              severity: "warning",
              message: `Employee ${employee.first_name} ${employee.last_name} is missing bank account details.`,
            },
          });
        }

        // Base wage from contract
        const baseWage = contract ? Number(contract.wage_amount) : 0;

        // Calculate attendance/working days for period
        const periodStart = new Date(period.date_from);
        const periodEnd = new Date(period.date_to);
        const totalDaysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 3600 * 24)) + 1;
        const standardWorkingDays = Math.min(22, totalDaysInPeriod);

        // Compute rule lines in order of rule sequence
        let computedBasic = 0;
        let computedGross = 0;
        let computedDeductions = 0;
        let computedNet = 0;

        const ruleResults: Record<string, number> = {};

        // If rules exist in structure, evaluate them in sequence
        if (rules.length > 0) {
          for (const rule of rules) {
            let amount = 0;
            const catCode = rule.salary_rule_categories?.code?.toUpperCase() || "";

            if (rule.calculation_type === "fixed") {
              amount = rule.fixed_amount ? Number(rule.fixed_amount) : 0;
              // If fixed rule amount is 0 and rule represents BASIC, fall back to 50% of base wage or full wage
              if (amount === 0) {
                if (rule.code === "BASIC") amount = baseWage * 0.50;
                else if (rule.code === "HRA") amount = baseWage * 0.20;
                else if (rule.code === "STD") amount = baseWage * 0.10;
                else if (rule.code === "FIXED" || rule.code === "SPECIAL") amount = baseWage * 0.20;
              }
            } else if (rule.calculation_type === "percentage") {
              const pct = rule.percentage ? Number(rule.percentage) : 0;
              const basedOnCode = rule.percentage_based_on || "BASIC";
              const baseValue = ruleResults[basedOnCode] || computedBasic || baseWage;
              amount = (baseValue * pct) / 100;
            } else if (rule.calculation_type === "formula") {
              // Standard formula evaluations
              if (rule.code === "GROSS") {
                amount = Object.entries(ruleResults).reduce((sum, [code, val]) => {
                  return code !== "GROSS" && code !== "NET" && code !== "PF" && code !== "ESIC" && code !== "PT" && code !== "LWF"
                    ? sum + val
                    : sum;
                }, 0);
              } else if (rule.code === "DEDUCTION" || rule.code === "TOTAL_DEDUCTION") {
                amount = computedDeductions;
              } else if (rule.code === "NET") {
                amount = Math.max(0, computedGross - computedDeductions);
              } else {
                amount = baseWage * 0.05;
              }
            }

            // Round amount to 2 decimal places
            amount = Math.round(amount * 100) / 100;
            ruleResults[rule.code] = amount;

            if (rule.code === "BASIC") computedBasic = amount;

            // Track Gross earnings vs Deductions based on category or code
            if (catCode === "GROSS" || catCode === "BASIC" || catCode === "ALW" || catCode === "ALLOWANCE" || rule.code === "BASIC" || rule.code === "HRA" || rule.code === "STD" || rule.code === "FIXED" || rule.code === "BONUS" || rule.code === "LTA") {
              if (rule.code !== "GROSS") computedGross += amount;
            } else if (catCode === "DED" || catCode === "DEDUCTION" || rule.code === "PF" || rule.code === "ESIC" || rule.code === "PT" || rule.code === "LWF") {
              computedDeductions += amount;
            }

            // Create payslip_lines entry
            await tx.payslip_lines.create({
              data: {
                payslip_id: payslip.id,
                salary_rule_id: rule.id,
                category_id: rule.category_id,
                name: rule.name,
                code: rule.code,
                sequence: rule.sequence,
                calculation_type: rule.calculation_type,
                rate: rule.percentage || 0,
                base_amount: baseWage,
                amount: amount,
                is_contribution: rule.is_contribution,
                appears_on_payslip: rule.appears_on_payslip,
              },
            });
          }
        } else {
          // Standard Default Rules Breakdown if structure has no active explicit rules
          computedBasic = Math.round((baseWage * 0.50) * 100) / 100;
          const hra = Math.round((baseWage * 0.20) * 100) / 100;
          const stdAllowance = Math.round((baseWage * 0.15) * 100) / 100;
          const fixedAllowance = Math.round((baseWage * 0.15) * 100) / 100;

          computedGross = computedBasic + hra + stdAllowance + fixedAllowance;

          const pf = Math.round((computedBasic * 0.12) * 100) / 100;
          const esic = computedGross <= 21000 ? Math.round((computedGross * 0.0075) * 100) / 100 : 0;
          const pt = 200;

          computedDeductions = pf + esic + pt;
        }

        if (computedGross === 0 && baseWage > 0) {
          computedGross = baseWage;
        }

        computedNet = Math.max(0, computedGross - computedDeductions);

        // Check for Zero Salary warning
        if (computedNet <= 0) {
          empHasWarning = true;
          totalWarningCount++;
          await tx.payrun_warnings.create({
            data: {
              payrun_id: payrunId,
              payslip_id: payslip.id,
              employee_id: employee.id,
              warning_type: "zero_salary",
              severity: "warning",
              message: `Employee ${employee.first_name} ${employee.last_name} calculated net salary is zero.`,
            },
          });
        }

        // Update Payslip record
        await tx.payslips.update({
          where: { id: payslip.id },
          data: {
            basic_salary: computedBasic,
            gross_salary: computedGross,
            total_deductions: computedDeductions,
            net_salary: computedNet,
            total_working_days: standardWorkingDays,
            days_worked: standardWorkingDays,
            state: "computed",
            has_warnings: empHasWarning,
          },
        });

        totalPayrunGross = totalPayrunGross.add(computedGross);
        totalPayrunDeductions = totalPayrunDeductions.add(computedDeductions);
        totalPayrunNet = totalPayrunNet.add(computedNet);
      }

      // Update Payrun record
      await tx.payruns.update({
        where: { id: payrunId },
        data: {
          total_gross: totalPayrunGross,
          total_deductions: totalPayrunDeductions,
          total_net: totalPayrunNet,
          computed_at: new Date(),
          computed_by: authCheck.sessionData.user.id,
          state: "computed",
          has_warnings: totalWarningCount > 0,
          warning_count: totalWarningCount,
        },
      });
    });

    return jsonCorsResponse({
      success: true,
      data: {
        message: "Payrun computed successfully.",
        payrun_id: payrunId,
        state: "computed",
        total_gross: totalPayrunGross.toString(),
        total_deductions: totalPayrunDeductions.toString(),
        total_net: totalPayrunNet.toString(),
        warning_count: totalWarningCount,
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("POST /api/payruns/[id]/compute error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to compute payroll: " + (error.message || "Server error") }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

function isDateRangeOverlapping(
  aStart: Date,
  aEnd: Date | null,
  bStart: Date,
  bEnd: Date | null
): boolean {
  const aStartMs = aStart.getTime();
  const aEndMs = aEnd ? aEnd.getTime() : Infinity;
  const bStartMs = bStart.getTime();
  const bEndMs = bEnd ? bEnd.getTime() : Infinity;

  return aStartMs <= bEndMs && bStartMs <= aEndMs;
}

function mapContractStatusDisplay(state: string): string {
  switch (state) {
    case "active":
      return "Running";
    case "expired":
      return "Expired";
    case "draft":
      return "Draft";
    case "cancelled":
      return "Cancelled";
    default:
      return state;
  }
}

function formatContractDetailPayload(contract: any) {
  const emp = contract.employees;
  const dept = contract.departments;
  const jobPos = contract.job_positions;
  const jobTitle = contract.job_titles;
  const schedule = contract.working_schedules;
  const structure = contract.salary_structures;

  const employeeName = emp
    ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
    : "Unassigned";

  const wageAmount = contract.wage_amount ? contract.wage_amount.toString() : "0.00";
  const dateStartStr = contract.date_start ? contract.date_start.toISOString().split("T")[0] : "";
  const dateEndStr = contract.date_end ? contract.date_end.toISOString().split("T")[0] : null;

  return {
    id: contract.id,
    reference: contract.reference,
    contract_reference: contract.reference,
    contract_type: contract.contract_type,
    employee_id: contract.employee_id,
    employee: {
      id: emp?.id || contract.employee_id,
      name: employeeName,
      first_name: emp?.first_name || "",
      last_name: emp?.last_name || "",
      employee_code: emp?.employee_code || "",
      work_email: emp?.work_email || "",
      department: emp?.departments?.name || dept?.name || "N/A",
    },
    department_id: contract.department_id || null,
    department: dept?.name || "N/A",
    department_detail: dept ? { id: dept.id, name: dept.name, code: dept.code } : null,
    job_position_id: contract.job_position_id || contract.job_title_id || null,
    job_position: jobPos?.title || jobTitle?.name || "N/A",
    job_position_detail: jobPos
      ? { id: jobPos.id, title: jobPos.title }
      : jobTitle
      ? { id: jobTitle.id, name: jobTitle.name }
      : null,
    date_start: dateStartStr,
    date_end: dateEndStr,
    wage_type: contract.wage_type,
    wage_amount: wageAmount,
    wage_per_month: wageAmount,
    currency_code: contract.currency_code || "INR",
    working_schedule_id: contract.working_schedule_id || null,
    working_schedule: schedule
      ? `${schedule.name} (${schedule.total_weekly_hours ? schedule.total_weekly_hours.toString() : '40'} Hours/Week)`
      : "Standard (40 Hours/Week)",
    working_schedule_detail: schedule
      ? {
          id: schedule.id,
          name: schedule.name,
          total_weekly_hours: schedule.total_weekly_hours ? schedule.total_weekly_hours.toString() : "40.00",
        }
      : null,
    salary_structure_id: contract.salary_structure_id || null,
    salary_structure: structure ? structure.name : "Standard Salary Structure",
    salary_structure_detail: structure
      ? { id: structure.id, name: structure.name, code: structure.code }
      : null,
    state: contract.state,
    status: mapContractStatusDisplay(contract.state),
    notes: contract.notes || null,
    payslips_count: Array.isArray(contract.payslips) ? contract.payslips.length : 0,
    created_at: contract.created_at ? contract.created_at.toISOString() : null,
    updated_at: contract.updated_at ? contract.updated_at.toISOString() : null,
  };
}

/**
 * GET /api/contracts/[id]
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse(
        { success: false, error: "Authentication required." },
        { status: 401 },
        req
      );
    }

    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return jsonCorsResponse(
        { success: false, error: "Invalid contract ID format." },
        { status: 400 },
        req
      );
    }

    const contract = await prisma.employee_contracts.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
            work_email: true,
          },
        },
        departments: {
          select: { id: true, name: true, code: true },
        },
        job_positions: {
          select: { id: true, title: true },
        },
        job_titles: {
          select: { id: true, name: true },
        },
        working_schedules: {
          select: { id: true, name: true, total_weekly_hours: true },
        },
        salary_structures: {
          select: { id: true, name: true, code: true },
        },
        payslips: {
          select: { id: true, state: true, reference: true },
        },
      },
    });

    if (!contract) {
      return jsonCorsResponse(
        { success: false, error: "Contract not found." },
        { status: 404 },
        req
      );
    }

    return jsonCorsResponse(
      {
        success: true,
        data: {
          contract: formatContractDetailPayload(contract),
        },
      },
      undefined,
      req
    );
  } catch (error: any) {
    console.error("GET /api/contracts/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to fetch contract details." },
      { status: 500 },
      req
    );
  }
}

/**
 * PATCH /api/contracts/[id]
 */
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
    if (isNaN(id) || id <= 0) {
      return jsonCorsResponse(
        { success: false, error: "Invalid contract ID format." },
        { status: 400 },
        req
      );
    }

    const existingContract = await prisma.employee_contracts.findUnique({
      where: { id },
    });

    if (!existingContract) {
      return jsonCorsResponse(
        { success: false, error: "Contract not found." },
        { status: 404 },
        req
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 },
        req
      );
    }

    const {
      date_start,
      date_end,
      wage_amount,
      wage_type,
      contract_type,
      department_id,
      job_position_id,
      working_schedule_id,
      salary_structure_id,
      state,
      notes,
      reference,
    } = body || {};

    // Determine target start and end dates
    let targetStart = existingContract.date_start;
    if (date_start !== undefined) {
      if (!date_start || isNaN(new Date(date_start).getTime())) {
        return jsonCorsResponse(
          { success: false, error: "Invalid date_start format." },
          { status: 400 },
          req
        );
      }
      targetStart = new Date(date_start);
    }

    let targetEnd: Date | null = existingContract.date_end;
    if (date_end !== undefined) {
      if (date_end === null || date_end === "") {
        targetEnd = null;
      } else {
        if (isNaN(new Date(date_end).getTime())) {
          return jsonCorsResponse(
            { success: false, error: "Invalid date_end format." },
            { status: 400 },
            req
          );
        }
        targetEnd = new Date(date_end);
      }
    }

    if (targetEnd && targetEnd < targetStart) {
      return jsonCorsResponse(
        { success: false, error: "End date must be greater than or equal to start date." },
        { status: 422 },
        req
      );
    }

    // Validate wage_amount if provided
    let targetWage = existingContract.wage_amount;
    if (wage_amount !== undefined) {
      if (wage_amount === null || isNaN(Number(wage_amount)) || Number(wage_amount) < 0) {
        return jsonCorsResponse(
          { success: false, error: "Valid non-negative wage_amount is required." },
          { status: 422 },
          req
        );
      }
      targetWage = Number(wage_amount) as any;
    }

    // Validate relations if updated
    if (department_id) {
      const deptExists = await prisma.departments.findUnique({ where: { id: Number(department_id) } });
      if (!deptExists) {
        return jsonCorsResponse(
          { success: false, error: "Referenced department does not exist." },
          { status: 422 },
          req
        );
      }
    }

    if (job_position_id) {
      const posExists = await prisma.job_positions.findUnique({ where: { id: Number(job_position_id) } });
      if (!posExists) {
        return jsonCorsResponse(
          { success: false, error: "Referenced job_position does not exist." },
          { status: 422 },
          req
        );
      }
    }

    if (working_schedule_id) {
      const schedExists = await prisma.working_schedules.findUnique({ where: { id: Number(working_schedule_id) } });
      if (!schedExists) {
        return jsonCorsResponse(
          { success: false, error: "Referenced working_schedule does not exist." },
          { status: 422 },
          req
        );
      }
    }

    if (salary_structure_id) {
      const structExists = await prisma.salary_structures.findUnique({ where: { id: Number(salary_structure_id) } });
      if (!structExists) {
        return jsonCorsResponse(
          { success: false, error: "Referenced salary_structure does not exist." },
          { status: 422 },
          req
        );
      }
    }

    // Determine target state
    let targetState = existingContract.state;
    if (state !== undefined) {
      let mappedState = String(state).toLowerCase();
      if (mappedState === "running") mappedState = "active";
      if (["draft", "active", "expired", "cancelled"].includes(mappedState)) {
        targetState = mappedState as any;
      }
    }

    // BUSINESS RULE: Overlapping contract check for active contracts
    if (targetState === "active") {
      const otherActiveContracts = await prisma.employee_contracts.findMany({
        where: {
          employee_id: existingContract.employee_id,
          state: "active",
          id: { not: id },
        },
      });

      for (const other of otherActiveContracts) {
        const existStart = new Date(other.date_start);
        const existEnd = other.date_end ? new Date(other.date_end) : null;

        if (isDateRangeOverlapping(targetStart, targetEnd, existStart, existEnd)) {
          return jsonCorsResponse(
            {
              success: false,
              error: "Employee already has a running contract for this period.",
            },
            { status: 409 },
            req
          );
        }
      }
    }

    // Update contract record
    const updatedContract = await prisma.employee_contracts.update({
      where: { id },
      data: {
        date_start: targetStart,
        date_end: targetEnd,
        wage_amount: targetWage,
        ...(wage_type ? { wage_type: wage_type as any } : {}),
        ...(contract_type ? { contract_type: contract_type as any } : {}),
        ...(department_id !== undefined ? { department_id: department_id ? Number(department_id) : null } : {}),
        ...(job_position_id !== undefined ? { job_position_id: job_position_id ? Number(job_position_id) : null } : {}),
        ...(working_schedule_id !== undefined ? { working_schedule_id: working_schedule_id ? Number(working_schedule_id) : null } : {}),
        ...(salary_structure_id !== undefined ? { salary_structure_id: salary_structure_id ? Number(salary_structure_id) : null } : {}),
        ...(state !== undefined ? { state: targetState as any } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        ...(reference ? { reference: reference.trim() } : {}),
      },
      include: {
        employees: {
          select: {
            id: true,
            employee_code: true,
            first_name: true,
            last_name: true,
            work_email: true,
          },
        },
        departments: {
          select: { id: true, name: true, code: true },
        },
        job_positions: {
          select: { id: true, title: true },
        },
        job_titles: {
          select: { id: true, name: true },
        },
        working_schedules: {
          select: { id: true, name: true, total_weekly_hours: true },
        },
        salary_structures: {
          select: { id: true, name: true, code: true },
        },
        payslips: {
          select: { id: true },
        },
      },
    });

    return jsonCorsResponse(
      {
        success: true,
        data: {
          contract: formatContractDetailPayload(updatedContract),
        },
      },
      undefined,
      req
    );
  } catch (error: any) {
    console.error("PATCH /api/contracts/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to update contract record." },
      { status: 500 },
      req
    );
  }
}

/**
 * DELETE /api/contracts/[id]
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireAdmin();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const id = Number(params.id);
    if (isNaN(id) || id <= 0) {
      return jsonCorsResponse(
        { success: false, error: "Invalid contract ID format." },
        { status: 400 },
        req
      );
    }

    const contract = await prisma.employee_contracts.findUnique({
      where: { id },
      include: {
        payslips: { select: { id: true } },
      },
    });

    if (!contract) {
      return jsonCorsResponse(
        { success: false, error: "Contract not found." },
        { status: 404 },
        req
      );
    }

    // Check if payslips depend on this contract
    if (contract.payslips.length > 0) {
      const updatedContract = await prisma.employee_contracts.update({
        where: { id },
        data: { state: "cancelled" },
      });

      return jsonCorsResponse(
        {
          success: false,
          error: "Cannot delete contract associated with payslips. State updated to cancelled instead.",
          data: {
            contract_id: id,
            state: "cancelled",
          },
        },
        { status: 422 },
        req
      );
    }

    // If no payslips exist, perform deletion
    await prisma.employee_contracts.delete({
      where: { id },
    });

    return jsonCorsResponse(
      {
        success: true,
        message: "Contract deleted successfully.",
        data: { contract_id: id },
      },
      undefined,
      req
    );
  } catch (error: any) {
    console.error("DELETE /api/contracts/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to delete contract record." },
      { status: 500 },
      req
    );
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

/**
 * Helper to check if two date ranges overlap.
 * Range A: [aStart, aEnd] (aEnd null means open-ended / infinity)
 * Range B: [bStart, bEnd] (bEnd null means open-ended / infinity)
 */
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

/**
 * Helper to map DB state to UI status text.
 */
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

/**
 * Format raw Prisma contract for API response.
 */
function formatContractPayload(contract: any) {
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
    created_at: contract.created_at ? contract.created_at.toISOString() : null,
    updated_at: contract.updated_at ? contract.updated_at.toISOString() : null,
  };
}

/**
 * GET /api/contracts
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse(
        { success: false, error: "Authentication required." },
        { status: 401 },
        req
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const employeeIdRaw = searchParams.get("employee_id");
    const departmentIdRaw = searchParams.get("department_id");
    const stateRaw = searchParams.get("state")?.trim().toLowerCase();
    const pageRaw = searchParams.get("page");
    const limitRaw = searchParams.get("limit");

    let page = parseInt(pageRaw || "1", 10);
    if (isNaN(page) || page < 1) page = 1;

    let limit = parseInt(limitRaw || "50", 10);
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (employeeIdRaw) {
      const empId = parseInt(employeeIdRaw, 10);
      if (!isNaN(empId)) whereCondition.employee_id = empId;
    }

    if (departmentIdRaw) {
      const deptId = parseInt(departmentIdRaw, 10);
      if (!isNaN(deptId)) whereCondition.department_id = deptId;
    }

    if (stateRaw && stateRaw !== "all") {
      // Map UI state filters (e.g. running -> active)
      const mappedState = stateRaw === "running" ? "active" : stateRaw;
      if (["draft", "active", "expired", "cancelled"].includes(mappedState)) {
        whereCondition.state = mappedState;
      }
    }

    if (search) {
      whereCondition.OR = [
        { reference: { contains: search } },
        { employees: { first_name: { contains: search } } },
        { employees: { last_name: { contains: search } } },
        { employees: { work_email: { contains: search } } },
        { employees: { employee_code: { contains: search } } },
        { departments: { name: { contains: search } } },
        { job_positions: { title: { contains: search } } },
        { job_titles: { name: { contains: search } } },
      ];
    }

    const [totalCount, rawContracts] = await Promise.all([
      prisma.employee_contracts.count({ where: whereCondition }),
      prisma.employee_contracts.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: [{ date_start: "desc" }, { id: "desc" }],
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
        },
      }),
    ]);

    const formattedContracts = rawContracts.map(formatContractPayload);
    const totalPages = Math.ceil(totalCount / limit) || 1;

    return jsonCorsResponse(
      {
        success: true,
        data: {
          contracts: formattedContracts,
          meta: {
            total: totalCount,
            page,
            limit,
            totalPages,
          },
        },
      },
      undefined,
      req
    );
  } catch (error: any) {
    console.error("GET /api/contracts error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to retrieve employee contracts." },
      { status: 500 },
      req
    );
  }
}

/**
 * POST /api/contracts
 */
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
      return jsonCorsResponse(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 },
        req
      );
    }

    const {
      employee_id,
      date_start,
      date_end,
      wage_amount,
      wage_type = "monthly",
      contract_type = "permanent",
      department_id,
      job_position_id,
      working_schedule_id,
      salary_structure_id,
      state = "active",
      reference,
      notes,
    } = body || {};

    // 1. Validate employee_id
    if (!employee_id || isNaN(Number(employee_id))) {
      return jsonCorsResponse(
        { success: false, error: "Valid employee_id is required." },
        { status: 400 },
        req
      );
    }

    const empId = Number(employee_id);
    const employee = await prisma.employees.findUnique({
      where: { id: empId },
    });

    if (!employee || employee.deleted_at) {
      return jsonCorsResponse(
        { success: false, error: "Employee does not exist." },
        { status: 404 },
        req
      );
    }

    // 2. Validate dates
    if (!date_start || isNaN(new Date(date_start).getTime())) {
      return jsonCorsResponse(
        { success: false, error: "Valid start date (date_start) is required." },
        { status: 400 },
        req
      );
    }

    const reqDateStart = new Date(date_start);
    let reqDateEnd: Date | null = null;

    if (date_end) {
      if (isNaN(new Date(date_end).getTime())) {
        return jsonCorsResponse(
          { success: false, error: "Invalid end date (date_end) format." },
          { status: 400 },
          req
        );
      }
      reqDateEnd = new Date(date_end);
      if (reqDateEnd < reqDateStart) {
        return jsonCorsResponse(
          { success: false, error: "End date must be greater than or equal to start date." },
          { status: 422 },
          req
        );
      }
    }

    // 3. Validate wage amount
    if (wage_amount === undefined || wage_amount === null || isNaN(Number(wage_amount)) || Number(wage_amount) < 0) {
      return jsonCorsResponse(
        { success: false, error: "Valid non-negative wage_amount is required." },
        { status: 422 },
        req
      );
    }

    // 4. Validate relationships if provided
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

    // Map UI state to DB state (running -> active)
    let reqState = (state || "active").toLowerCase();
    if (reqState === "running") reqState = "active";
    if (!["draft", "active", "expired", "cancelled"].includes(reqState)) {
      reqState = "active";
    }

    // 5. BUSINESS RULE: Server-side Overlapping Contract Check for 'active' running contracts
    if (reqState === "active") {
      const existingActiveContracts = await prisma.employee_contracts.findMany({
        where: {
          employee_id: empId,
          state: "active",
        },
      });

      for (const existingContract of existingActiveContracts) {
        const existStart = new Date(existingContract.date_start);
        const existEnd = existingContract.date_end ? new Date(existingContract.date_end) : null;

        if (isDateRangeOverlapping(reqDateStart, reqDateEnd, existStart, existEnd)) {
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

    // 6. Generate reference if not provided
    let contractReference = (reference || "").trim();
    if (!contractReference) {
      const year = reqDateStart.getFullYear();
      const seq = Date.now().toString().slice(-4);
      contractReference = `CON/${year}/${String(empId).padStart(3, "0")}${seq}`;
    }

    // Check reference uniqueness
    const refExists = await prisma.employee_contracts.findUnique({
      where: { reference: contractReference },
    });
    if (refExists) {
      contractReference = `${contractReference}-${Math.floor(Math.random() * 1000)}`;
    }

    // 7. Create contract inside Prisma transaction
    const newContract = await prisma.$transaction(async (tx) => {
      return tx.employee_contracts.create({
        data: {
          employee_id: empId,
          reference: contractReference,
          contract_type: contract_type as any,
          department_id: department_id ? Number(department_id) : employee.department_id,
          job_position_id: job_position_id ? Number(job_position_id) : employee.job_position_id,
          job_title_id: employee.job_title_id,
          date_start: reqDateStart,
          date_end: reqDateEnd,
          wage_type: wage_type as any,
          wage_amount: Number(wage_amount),
          currency_code: "INR",
          working_schedule_id: working_schedule_id ? Number(working_schedule_id) : 1,
          salary_structure_id: salary_structure_id ? Number(salary_structure_id) : 1,
          state: reqState as any,
          notes: notes || null,
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
        },
      });
    });

    return jsonCorsResponse(
      {
        success: true,
        data: {
          contract: formatContractPayload(newContract),
        },
      },
      { status: 201 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/contracts error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to create contract record." },
      { status: 500 },
      req
    );
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

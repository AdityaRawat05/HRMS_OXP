import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

/**
 * Helper to compute initials from first and last name.
 * e.g., Aarav Mehta -> AM, Sara Khan -> SK, John -> J
 */
function getInitials(firstName?: string | null, lastName?: string | null): string {
  const firstInitial = (firstName || "").trim().charAt(0).toUpperCase();
  const lastInitial = (lastName || "").trim().charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}` || "E";
}

export async function GET(req: Request) {
  try {
    // 1. Authentication Check
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse(
        { success: false, error: "Authentication required." },
        { status: 401 },
        req
      );
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const departmentIdRaw = searchParams.get("department_id");
    const kanbanState = searchParams.get("kanban_state")?.trim().toLowerCase();
    const employmentType = searchParams.get("employment_type")?.trim().toLowerCase();
    const isActiveRaw = searchParams.get("is_active");
    const pageRaw = searchParams.get("page");
    const limitRaw = searchParams.get("limit");

    // Pagination validation
    let page = parseInt(pageRaw || "1", 10);
    if (isNaN(page) || page < 1) page = 1;

    let limit = parseInt(limitRaw || "50", 10);
    if (isNaN(limit) || limit < 1) limit = 50;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    // Build Prisma query condition
    const whereCondition: any = {
      deleted_at: null,
    };

    // Active status filter
    if (isActiveRaw !== null && isActiveRaw !== undefined && isActiveRaw !== "all") {
      whereCondition.is_active = isActiveRaw === "true" || isActiveRaw === "1";
    }

    // Department filter
    if (departmentIdRaw) {
      const deptId = parseInt(departmentIdRaw, 10);
      if (!isNaN(deptId)) {
        whereCondition.department_id = deptId;
      }
    }

    // Kanban state filter (enum: new, in_progress, verified, archived)
    if (kanbanState && ["new", "in_progress", "verified", "archived"].includes(kanbanState)) {
      whereCondition.kanban_state = kanbanState;
    }

    // Employment type filter
    if (
      employmentType &&
      ["full_time", "part_time", "contractor", "intern", "temporary"].includes(employmentType)
    ) {
      whereCondition.employment_type = employmentType;
    }

    // Search condition across name, email, employee_code, department, job position/title
    if (search) {
      whereCondition.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { work_email: { contains: search } },
        { employee_code: { contains: search } },
        { departments_employees_department_idTodepartments: { name: { contains: search } } },
        { job_positions: { title: { contains: search } } },
        { job_titles: { name: { contains: search } } },
      ];
    }

    // 3. Query total count and records using Prisma relations
    const [totalCount, employees] = await Promise.all([
      prisma.employees.count({ where: whereCondition }),
      prisma.employees.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
        select: {
          id: true,
          employee_code: true,
          first_name: true,
          last_name: true,
          work_email: true,
          phone: true,
          mobile: true,
          avatar_url: true,
          employment_type: true,
          kanban_state: true,
          is_active: true,
          hire_date: true,
          bank_name: true,
          bank_account_no: true,
          bank_ifsc_code: true,
          bank_branch: true,
          departments_employees_department_idTodepartments: {
            select: { id: true, name: true },
          },
          job_positions: {
            select: { id: true, title: true },
          },
          job_titles: {
            select: { id: true, name: true },
          },
          companies: {
            select: { id: true, name: true },
          },
          employees: {
            select: { id: true, first_name: true, last_name: true },
          },
        },
      }),
    ]);

    // 4. Format payload with computed initials, full_name, and status
    const formattedEmployees = employees.map((emp) => {
      const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
      const initials = getInitials(emp.first_name, emp.last_name);
      const departmentName = emp.departments_employees_department_idTodepartments?.name || "Unassigned";
      const jobPositionTitle = emp.job_positions?.title || emp.job_titles?.name || "N/A";
      const statusText = emp.is_active ? "Active" : "Inactive";

      return {
        id: emp.id,
        employeeCode: emp.employee_code,
        employee_code: emp.employee_code,
        firstName: emp.first_name,
        first_name: emp.first_name,
        lastName: emp.last_name,
        last_name: emp.last_name,
        fullName,
        full_name: fullName,
        initials,
        workEmail: emp.work_email || "",
        work_email: emp.work_email || "",
        phone: emp.phone || emp.mobile || null,
        avatarUrl: emp.avatar_url || null,
        avatar_url: emp.avatar_url || null,
        employmentType: emp.employment_type,
        employment_type: emp.employment_type,
        kanbanState: emp.kanban_state,
        kanban_state: emp.kanban_state,
        isActive: emp.is_active,
        is_active: emp.is_active,
        status: statusText,
        department: departmentName,
        departmentId: emp.departments_employees_department_idTodepartments?.id || null,
        department_id: emp.departments_employees_department_idTodepartments?.id || null,
        jobPosition: jobPositionTitle,
        job_position: jobPositionTitle,
        jobPositionId: emp.job_positions?.id || emp.job_titles?.id || null,
        companyName: emp.companies?.name || null,
        managerName: emp.employees
          ? `${emp.employees.first_name || ""} ${emp.employees.last_name || ""}`.trim()
          : null,
        bankName: emp.bank_name || null,
        bankAccountNo: emp.bank_account_no || null,
        bankIfscCode: emp.bank_ifsc_code || null,
        bankBranch: emp.bank_branch || null,
      };
    });

    const totalPages = Math.ceil(totalCount / limit) || 1;

    // 5. Return standardized JSON response
    return jsonCorsResponse(
      {
        success: true,
        data: {
          employees: formattedEmployees,
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
    console.error("Employees API error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to retrieve employee records." },
      { status: 500 },
      req
    );
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}


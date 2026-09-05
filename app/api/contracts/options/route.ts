import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

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

    const [employees, departments, jobPositions, workingSchedules, salaryStructures] = await Promise.all([
      prisma.employees.findMany({
        where: { is_active: true, deleted_at: null },
        orderBy: { first_name: "asc" },
        select: {
          id: true,
          employee_code: true,
          first_name: true,
          last_name: true,
          work_email: true,
          department_id: true,
        },
      }),
      prisma.departments.findMany({
        where: { is_active: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
      prisma.job_positions.findMany({
        where: { is_active: true },
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
        },
      }),
      prisma.working_schedules.findMany({
        where: { is_active: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          total_weekly_hours: true,
        },
      }),
      prisma.salary_structures.findMany({
        where: { is_active: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
    ]);

    const formattedEmployees = employees.map((e) => ({
      id: e.id,
      employee_code: e.employee_code,
      first_name: e.first_name,
      last_name: e.last_name,
      name: `${e.first_name} ${e.last_name}`.trim(),
      work_email: e.work_email,
      department_id: e.department_id,
    }));

    const formattedSchedules = workingSchedules.map((s) => ({
      id: s.id,
      name: s.name,
      total_weekly_hours: s.total_weekly_hours ? s.total_weekly_hours.toString() : "40.00",
    }));

    return jsonCorsResponse(
      {
        success: true,
        data: {
          employees: formattedEmployees,
          departments,
          job_positions: jobPositions,
          working_schedules: formattedSchedules,
          salary_structures: salaryStructures,
        },
      },
      undefined,
      req
    );
  } catch (error: any) {
    console.error("GET /api/contracts/options error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to fetch contract form options." },
      { status: 500 },
      req
    );
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

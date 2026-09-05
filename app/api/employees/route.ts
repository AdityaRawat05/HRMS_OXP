import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const employees = await prisma.employees.findMany({
      where: {
        is_active: true,
        deleted_at: null,
        ...(search
          ? {
              OR: [
                { first_name: { contains: search } },
                { last_name: { contains: search } },
                { work_email: { contains: search } },
                { employee_code: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { first_name: "asc" },
      select: {
        id: true,
        employee_code: true,
        first_name: true,
        last_name: true,
        work_email: true,
        user_id: true,
      },
    });

    return jsonCorsResponse({
      success: true,
      data: { employees },
    }, undefined, req);
  } catch (error) {
    console.error("Employees route error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to fetch employees." },
      { status: 500 },
      req
    );
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

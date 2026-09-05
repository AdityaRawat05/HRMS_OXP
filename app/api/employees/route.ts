import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({
      success: true,
      data: { employees },
    });
  } catch (error) {
    console.error("Employees route error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees." },
      { status: 500 }
    );
  }
}

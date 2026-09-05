import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
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
    const state = searchParams.get("state")?.trim().toLowerCase() || "";
    const year = searchParams.get("year") ? Number(searchParams.get("year")) : null;

    const periods = await prisma.payroll_periods.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search } },
                ],
              }
            : {},
          state ? { state: state as any } : {},
          year
            ? {
                OR: [
                  { date_from: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
                  { date_to: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
                ],
              }
            : {},
        ],
      },
      include: {
        companies: {
          select: { id: true, name: true },
        },
        _count: {
          select: { payruns: true, payslips: true },
        },
      },
      orderBy: { date_from: "desc" },
    });

    const formattedPeriods = periods.map((p) => ({
      id: p.id,
      company_id: p.company_id,
      company_name: p.companies.name,
      name: p.name,
      date_from: p.date_from.toISOString().split("T")[0],
      date_to: p.date_to.toISOString().split("T")[0],
      state: p.state,
      payrun_count: p._count.payruns,
      payslip_count: p._count.payslips,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    return jsonCorsResponse({
      success: true,
      data: { payroll_periods: formattedPeriods },
    }, undefined, req);
  } catch (error: any) {
    console.error("GET /api/payroll-periods error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to fetch payroll periods." }, { status: 500 }, req);
  }
}

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
      return jsonCorsResponse({ success: false, error: "Invalid JSON body." }, { status: 400 }, req);
    }

    const { company_id, name, date_from, date_to, state } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return jsonCorsResponse({ success: false, error: "Period name is required." }, { status: 400 }, req);
    }

    if (!date_from || !date_to) {
      return jsonCorsResponse({ success: false, error: "date_from and date_to are required." }, { status: 400 }, req);
    }

    const fromDate = new Date(date_from);
    const toDate = new Date(date_to);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return jsonCorsResponse({ success: false, error: "Invalid date format." }, { status: 400 }, req);
    }

    if (fromDate > toDate) {
      return jsonCorsResponse({ success: false, error: "date_from cannot be after date_to." }, { status: 400 }, req);
    }

    let resolvedCompanyId = company_id ? Number(company_id) : null;
    if (!resolvedCompanyId) {
      const defaultCompany = await prisma.companies.findFirst({ where: { is_active: true } });
      resolvedCompanyId = defaultCompany ? defaultCompany.id : 2;
    }

    const newPeriod = await prisma.payroll_periods.create({
      data: {
        company_id: resolvedCompanyId,
        name: name.trim(),
        date_from: fromDate,
        date_to: toDate,
        state: state && ["open", "closed", "locked"].includes(state) ? state : "open",
      },
    });

    return jsonCorsResponse({
      success: true,
      data: {
        payroll_period: {
          id: newPeriod.id,
          company_id: newPeriod.company_id,
          name: newPeriod.name,
          date_from: newPeriod.date_from.toISOString().split("T")[0],
          date_to: newPeriod.date_to.toISOString().split("T")[0],
          state: newPeriod.state,
          created_at: newPeriod.created_at,
          updated_at: newPeriod.updated_at,
        },
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("POST /api/payroll-periods error:", error);
    if (error.code === "P2002") {
      return jsonCorsResponse({ success: false, error: "A payroll period for these dates already exists." }, { status: 409 }, req);
    }
    return jsonCorsResponse({ success: false, error: "Failed to create payroll period." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

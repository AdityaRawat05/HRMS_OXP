import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Authentication required." }, { status: 401 }, req);
    }

    const id = Number(params.id);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid payroll period ID." }, { status: 400 }, req);
    }

    const period = await prisma.payroll_periods.findUnique({
      where: { id },
      include: {
        companies: { select: { id: true, name: true } },
        payruns: {
          select: {
            id: true,
            name: true,
            reference: true,
            state: true,
            total_net: true,
            payslip_count: true,
            warning_count: true,
            created_at: true,
          },
          orderBy: { id: "desc" },
        },
        _count: { select: { payslips: true } },
      },
    });

    if (!period) {
      return jsonCorsResponse({ success: false, error: "Payroll period not found." }, { status: 404 }, req);
    }

    return jsonCorsResponse({
      success: true,
      data: {
        payroll_period: {
          id: period.id,
          company_id: period.company_id,
          company_name: period.companies.name,
          name: period.name,
          date_from: period.date_from.toISOString().split("T")[0],
          date_to: period.date_to.toISOString().split("T")[0],
          state: period.state,
          payruns: period.payruns.map((pr) => ({
            id: pr.id,
            name: pr.name,
            reference: pr.reference,
            state: pr.state,
            total_net: pr.total_net.toString(),
            payslip_count: pr.payslip_count,
            warning_count: pr.warning_count,
            created_at: pr.created_at,
          })),
          payslip_count: period._count.payslips,
          created_at: period.created_at,
          updated_at: period.updated_at,
        },
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("GET /api/payroll-periods/[id] error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to fetch payroll period." }, { status: 500 }, req);
  }
}

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
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid payroll period ID." }, { status: 400 }, req);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid JSON body." }, { status: 400 }, req);
    }

    const { name, state, date_from, date_to } = body || {};

    const existing = await prisma.payroll_periods.findUnique({ where: { id } });
    if (!existing) {
      return jsonCorsResponse({ success: false, error: "Payroll period not found." }, { status: 404 }, req);
    }

    const updateData: any = {};
    if (name && typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }
    if (state && ["open", "closed", "locked"].includes(state)) {
      updateData.state = state;
    }
    if (date_from) {
      const d = new Date(date_from);
      if (!isNaN(d.getTime())) updateData.date_from = d;
    }
    if (date_to) {
      const d = new Date(date_to);
      if (!isNaN(d.getTime())) updateData.date_to = d;
    }

    const updated = await prisma.payroll_periods.update({
      where: { id },
      data: updateData,
    });

    return jsonCorsResponse({
      success: true,
      data: {
        payroll_period: {
          id: updated.id,
          company_id: updated.company_id,
          name: updated.name,
          date_from: updated.date_from.toISOString().split("T")[0],
          date_to: updated.date_to.toISOString().split("T")[0],
          state: updated.state,
          updated_at: updated.updated_at,
        },
      },
    }, undefined, req);
  } catch (error: any) {
    console.error("PATCH /api/payroll-periods/[id] error:", error);
    return jsonCorsResponse({ success: false, error: "Failed to update payroll period." }, { status: 500 }, req);
  }
}

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

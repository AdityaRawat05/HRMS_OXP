import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  formatTimeOffTypePayload,
  logTimeOffAudit,
} from "@/lib/time-off";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * GET /api/time-off/types
 * List time off types with search and active status filters.
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const activeParam = searchParams.get("active") || searchParams.get("is_active");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") || "100", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (activeParam !== null && activeParam !== undefined && activeParam !== "all") {
      where.is_active = activeParam === "true" || activeParam === "1";
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { code: { contains: q } },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.time_off_types.count({ where }),
      prisma.time_off_types.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ is_active: "desc" }, { name: "asc" }],
      }),
    ]);

    const formattedData = records.map(formatTimeOffTypePayload);

    return jsonCorsResponse(
      {
        success: true,
        data: formattedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("GET /api/time-off/types error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * POST /api/time-off/types
 * Create a new Time Off Type / leave policy configuration (Admin/HR only).
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    if (!session.isAdmin) {
      return jsonCorsResponse(
        { success: false, error: "Unauthorized. Only HR/Admin can create leave configuration types." },
        { status: 403 },
        req
      );
    }

    const body = await req.json();
    const {
      name,
      code,
      color,
      leave_unit,
      leaveUnit,
      requires_approval,
      requiresApproval,
      requires_document,
      requiresDocument,
      max_consecutive_days,
      maxConsecutiveDays,
      is_paid,
      isPaid,
      affects_payroll,
      affectsPayroll,
      is_active,
      isActive,
      company_id,
      companyId,
    } = body;

    if (!name || !String(name).trim()) {
      return jsonCorsResponse(
        { success: false, error: "Time Off Type name is required." },
        { status: 422 },
        req
      );
    }

    const cleanName = String(name).trim();

    // Resolve company_id
    let resolvedCompanyId = parseInt(company_id || companyId, 10);
    if (!resolvedCompanyId || isNaN(resolvedCompanyId)) {
      const firstCompany = await prisma.companies.findFirst({ select: { id: true } });
      if (firstCompany) {
        resolvedCompanyId = firstCompany.id;
      } else {
        return jsonCorsResponse(
          { success: false, error: "No company found in database to associate leave type." },
          { status: 422 },
          req
        );
      }
    }

    // Auto generate code if missing
    let cleanCode = code ? String(code).trim().toUpperCase() : cleanName.replace(/[^A-Z0-9]/gi, "_").toUpperCase().substring(0, 20);

    // Check unique code per company
    const existingCode = await prisma.time_off_types.findFirst({
      where: {
        company_id: resolvedCompanyId,
        code: cleanCode,
      },
    });

    if (existingCode) {
      cleanCode = `${cleanCode}_${Date.now().toString().slice(-4)}`;
    }

    const unitEnum = (leave_unit || leaveUnit === "hours") ? "hours" : "days";
    const reqApproval = requires_approval !== undefined ? Boolean(requires_approval) : (requiresApproval !== undefined ? Boolean(requiresApproval) : true);
    const reqDoc = requires_document !== undefined ? Boolean(requires_document) : (requiresDocument !== undefined ? Boolean(requiresDocument) : false);
    const paid = is_paid !== undefined ? Boolean(is_paid) : (isPaid !== undefined ? Boolean(isPaid) : true);
    const payroll = affects_payroll !== undefined ? Boolean(affects_payroll) : (affectsPayroll !== undefined ? Boolean(affectsPayroll) : true);
    const active = is_active !== undefined ? Boolean(is_active) : (isActive !== undefined ? Boolean(isActive) : true);

    const maxDaysVal = parseInt(max_consecutive_days || maxConsecutiveDays, 10);

    const newType = await prisma.time_off_types.create({
      data: {
        company_id: resolvedCompanyId,
        name: cleanName,
        code: cleanCode,
        color: color || "#3498db",
        leave_unit: unitEnum,
        requires_approval: reqApproval,
        requires_document: reqDoc,
        max_consecutive_days: !isNaN(maxDaysVal) && maxDaysVal > 0 ? maxDaysVal : null,
        is_paid: paid,
        affects_payroll: payroll,
        is_active: active,
      },
    });

    await logTimeOffAudit(
      session.user.id,
      "CREATE_LEAVE_TYPE",
      "time_off_types",
      newType.id,
      null,
      newType
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time Off Type created successfully.",
        data: formatTimeOffTypePayload(newType),
      },
      { status: 201 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/time-off/types error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

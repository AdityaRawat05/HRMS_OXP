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
 * GET /api/time-off/types/[id]
 * Fetch single time off type detail.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid leave type ID" }, { status: 400 }, req);
    }

    const leaveType = await prisma.time_off_types.findUnique({
      where: { id },
    });

    if (!leaveType) {
      return jsonCorsResponse(
        { success: false, error: "Time Off Type not found." },
        { status: 404 },
        req
      );
    }

    return jsonCorsResponse(
      {
        success: true,
        data: formatTimeOffTypePayload(leaveType),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("GET /api/time-off/types/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * PATCH /api/time-off/types/[id]
 * Update time off type configuration (Admin/HR only).
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    if (!session.isAdmin) {
      return jsonCorsResponse(
        { success: false, error: "Unauthorized. Only HR/Admin can update leave type configuration." },
        { status: 403 },
        req
      );
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid leave type ID" }, { status: 400 }, req);
    }

    const existingType = await prisma.time_off_types.findUnique({
      where: { id },
    });

    if (!existingType) {
      return jsonCorsResponse(
        { success: false, error: "Time Off Type not found." },
        { status: 404 },
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
    } = body;

    const updateData: any = {};

    if (name && String(name).trim()) updateData.name = String(name).trim();
    if (code && String(code).trim()) updateData.code = String(code).trim().toUpperCase();
    if (color) updateData.color = String(color).trim();

    const unit = leave_unit || leaveUnit;
    if (unit && ["days", "hours"].includes(unit)) updateData.leave_unit = unit;

    if (requires_approval !== undefined) updateData.requires_approval = Boolean(requires_approval);
    else if (requiresApproval !== undefined) updateData.requires_approval = Boolean(requiresApproval);

    if (requires_document !== undefined) updateData.requires_document = Boolean(requires_document);
    else if (requiresDocument !== undefined) updateData.requires_document = Boolean(requiresDocument);

    if (is_paid !== undefined) updateData.is_paid = Boolean(is_paid);
    else if (isPaid !== undefined) updateData.is_paid = Boolean(isPaid);

    if (affects_payroll !== undefined) updateData.affects_payroll = Boolean(affects_payroll);
    else if (affectsPayroll !== undefined) updateData.affects_payroll = Boolean(affectsPayroll);

    if (is_active !== undefined) updateData.is_active = Boolean(is_active);
    else if (isActive !== undefined) updateData.is_active = Boolean(isActive);

    const maxDaysVal = max_consecutive_days !== undefined ? max_consecutive_days : maxConsecutiveDays;
    if (maxDaysVal !== undefined) {
      const parsed = parseInt(maxDaysVal, 10);
      updateData.max_consecutive_days = !isNaN(parsed) && parsed > 0 ? parsed : null;
    }

    updateData.updated_at = new Date();

    const updated = await prisma.time_off_types.update({
      where: { id },
      data: updateData,
    });

    await logTimeOffAudit(
      session.user.id,
      "UPDATE_LEAVE_TYPE",
      "time_off_types",
      id,
      existingType,
      updateData
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time Off Type updated successfully.",
        data: formatTimeOffTypePayload(updated),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("PATCH /api/time-off/types/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * DELETE /api/time-off/types/[id]
 * Deactivates (or deletes if unreferenced) a Time Off Type (Admin/HR only).
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    if (!session.isAdmin) {
      return jsonCorsResponse(
        { success: false, error: "Unauthorized. Only HR/Admin can delete or deactivate leave types." },
        { status: 403 },
        req
      );
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid leave type ID" }, { status: 400 }, req);
    }

    const existingType = await prisma.time_off_types.findUnique({
      where: { id },
      include: {
        time_off_requests: { select: { id: true }, take: 1 },
        time_off_allocations: { select: { id: true }, take: 1 },
      },
    });

    if (!existingType) {
      return jsonCorsResponse(
        { success: false, error: "Time Off Type not found." },
        { status: 404 },
        req
      );
    }

    const hasReferences = (existingType.time_off_requests?.length > 0) || (existingType.time_off_allocations?.length > 0);

    if (hasReferences) {
      // Deactivate rather than delete to preserve historical integrity
      const updated = await prisma.time_off_types.update({
        where: { id },
        data: { is_active: false, updated_at: new Date() },
      });

      await logTimeOffAudit(
        session.user.id,
        "DEACTIVATE_LEAVE_TYPE",
        "time_off_types",
        id,
        existingType,
        { is_active: false }
      );

      return jsonCorsResponse(
        {
          success: true,
          message: "Time Off Type has linked records and has been deactivated.",
          data: formatTimeOffTypePayload(updated),
        },
        { status: 200 },
        req
      );
    }

    await prisma.time_off_types.delete({
      where: { id },
    });

    await logTimeOffAudit(
      session.user.id,
      "DELETE_LEAVE_TYPE",
      "time_off_types",
      id,
      existingType,
      null
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time Off Type deleted successfully.",
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("DELETE /api/time-off/types/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

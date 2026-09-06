import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  formatTimeOffAllocationPayload,
  getUserManagedEmployeeIds,
  logTimeOffAudit,
} from "@/lib/time-off";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * GET /api/time-off/allocations/[id]
 * Fetch single time off allocation detail.
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
      return jsonCorsResponse({ success: false, error: "Invalid allocation ID" }, { status: 400 }, req);
    }

    const allocation = await prisma.time_off_allocations.findUnique({
      where: { id },
      include: {
        employees: true,
        time_off_types: true,
        users: true,
      },
    });

    if (!allocation) {
      return jsonCorsResponse(
        { success: false, error: "Time off allocation not found." },
        { status: 404 },
        req
      );
    }

    // Permission check
    if (!session.isAdmin) {
      const userEmployee = await prisma.employees.findFirst({
        where: {
          OR: [
            { user_id: session.user.id },
            { work_email: session.user.email },
          ],
        },
      });

      if (!userEmployee || userEmployee.id !== allocation.employee_id) {
        const managedIds = await getUserManagedEmployeeIds(session.user.id);
        if (!managedIds.includes(allocation.employee_id)) {
          return jsonCorsResponse(
            { success: false, error: "Unauthorized to view this allocation." },
            { status: 403 },
            req
          );
        }
      }
    }

    return jsonCorsResponse(
      {
        success: true,
        data: formatTimeOffAllocationPayload(allocation),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("GET /api/time-off/allocations/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * PATCH /api/time-off/allocations/[id]
 * Update time off allocation fields (HR/Admin only).
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
        { success: false, error: "Unauthorized. Ordinary employees cannot modify leave allocations." },
        { status: 403 },
        req
      );
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid allocation ID" }, { status: 400 }, req);
    }

    const existingAlloc = await prisma.time_off_allocations.findUnique({
      where: { id },
    });

    if (!existingAlloc) {
      return jsonCorsResponse(
        { success: false, error: "Time off allocation not found." },
        { status: 404 },
        req
      );
    }

    const body = await req.json();
    const {
      allocated_days,
      allocatedDays,
      validity_start,
      validityStart,
      validity_end,
      validityEnd,
      notes,
      state,
      allocation_type,
      allocationType,
    } = body;

    const updateData: any = {};

    const newAllocatedDays = parseFloat(allocated_days || allocatedDays);
    if (!isNaN(newAllocatedDays) && newAllocatedDays >= 0) {
      updateData.allocated_days = newAllocatedDays;
    }

    const rawValStart = validity_start || validityStart;
    if (rawValStart) {
      const vStart = new Date(rawValStart);
      if (!isNaN(vStart.getTime())) updateData.validity_start = vStart;
    }

    const rawValEnd = validity_end || validityEnd;
    if (rawValEnd) {
      const vEnd = new Date(rawValEnd);
      if (!isNaN(vEnd.getTime())) updateData.validity_end = vEnd;
    }

    if (notes !== undefined) updateData.notes = notes ? String(notes).trim() : null;
    if (allocation_type || allocationType) updateData.allocation_type = allocation_type || allocationType;

    if (state && ["draft", "approved", "refused", "cancelled"].includes(state)) {
      updateData.state = state;
      if (state === "approved" && existingAlloc.state !== "approved") {
        updateData.approved_by = session.user.id;
        updateData.approved_at = new Date();
      }
    }

    updateData.updated_at = new Date();

    const updated = await prisma.time_off_allocations.update({
      where: { id },
      data: updateData,
      include: {
        employees: true,
        time_off_types: true,
        users: true,
      },
    });

    await logTimeOffAudit(
      session.user.id,
      "UPDATE_ALLOCATION",
      "time_off_allocations",
      id,
      existingAlloc,
      updateData
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time off allocation updated successfully.",
        data: formatTimeOffAllocationPayload(updated),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("PATCH /api/time-off/allocations/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * DELETE /api/time-off/allocations/[id]
 * Delete time off allocation (HR/Admin only).
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
        { success: false, error: "Unauthorized. Only HR/Admin can delete leave allocations." },
        { status: 403 },
        req
      );
    }

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid allocation ID" }, { status: 400 }, req);
    }

    const existingAlloc = await prisma.time_off_allocations.findUnique({
      where: { id },
      include: {
        time_off_requests: true,
      },
    });

    if (!existingAlloc) {
      return jsonCorsResponse(
        { success: false, error: "Time off allocation not found." },
        { status: 404 },
        req
      );
    }

    if (existingAlloc.time_off_requests && existingAlloc.time_off_requests.length > 0) {
      return jsonCorsResponse(
        { success: false, error: "Cannot delete an allocation that has linked time off requests. Deactivate or cancel it instead." },
        { status: 409 },
        req
      );
    }

    await prisma.time_off_allocations.delete({
      where: { id },
    });

    await logTimeOffAudit(
      session.user.id,
      "DELETE_ALLOCATION",
      "time_off_allocations",
      id,
      existingAlloc,
      null
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time off allocation deleted successfully.",
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("DELETE /api/time-off/allocations/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  formatTimeOffAllocationPayload,
  logTimeOffAudit,
} from "@/lib/time-off";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * POST /api/time-off/allocations/[id]/approve
 * Approves a draft/submitted leave allocation request (HR/Admin only).
 */
export async function POST(
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
        { success: false, error: "Unauthorized. Only HR/Admin can approve leave allocations." },
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

    if (existingAlloc.state === "approved") {
      return jsonCorsResponse(
        { success: false, error: "Time off allocation is already approved." },
        { status: 409 },
        req
      );
    }

    const updated = await prisma.time_off_allocations.update({
      where: { id },
      data: {
        state: "approved",
        approved_by: session.user.id,
        approved_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        employees: true,
        time_off_types: true,
        users: true,
      },
    });

    await logTimeOffAudit(
      session.user.id,
      "APPROVE_ALLOCATION",
      "time_off_allocations",
      id,
      { state: existingAlloc.state },
      { state: "approved", approved_by: session.user.id }
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time off allocation approved successfully.",
        data: formatTimeOffAllocationPayload(updated),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/time-off/allocations/[id]/approve error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

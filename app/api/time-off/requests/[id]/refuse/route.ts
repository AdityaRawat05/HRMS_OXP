import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  formatTimeOffRequestPayload,
  getUserManagedEmployeeIds,
  logTimeOffAudit,
} from "@/lib/time-off";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * POST /api/time-off/requests/[id]/refuse
 * Refuses/rejects a time off request. Restores allocation balance if previously approved.
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

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid request ID" }, { status: 400 }, req);
    }

    let refusalReason = "Request refused by manager.";
    try {
      const body = await req.json();
      if (body && (body.refusal_reason || body.reason || body.refusalReason)) {
        refusalReason = body.refusal_reason || body.reason || body.refusalReason;
      }
    } catch {
      // Body may be empty
    }

    const existingRequest = await prisma.time_off_requests.findUnique({
      where: { id },
      include: {
        employees: true,
        time_off_types: true,
        time_off_allocations: true,
      },
    });

    if (!existingRequest) {
      return jsonCorsResponse(
        { success: false, error: "Time off request not found." },
        { status: 404 },
        req
      );
    }

    // Check manager / HR / Admin permission
    const managedIds = await getUserManagedEmployeeIds(session.user.id);
    const isManager = managedIds.includes(existingRequest.employee_id);
    const canRefuse = session.isAdmin || isManager;

    if (!canRefuse) {
      return jsonCorsResponse(
        { success: false, error: "Unauthorized. Only managers or HR/Admin can refuse leave requests." },
        { status: 403 },
        req
      );
    }

    if (existingRequest.state === "refused") {
      return jsonCorsResponse(
        { success: false, error: "Time off request is already refused." },
        { status: 409 },
        req
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // If request was approved previously, restore allocation balance
      if (existingRequest.state === "approved" && existingRequest.allocation_id) {
        const alloc = await tx.time_off_allocations.findUnique({
          where: { id: existingRequest.allocation_id },
        });

        if (alloc) {
          const allocDays = Number(alloc.allocated_days || 0);
          const usedDays = Number(alloc.used_days || 0);
          const numDays = Number(existingRequest.number_of_days);
          const newUsedDays = Math.max(0, usedDays - numDays);
          const newRemainingDays = Math.max(0, allocDays - newUsedDays);

          await tx.time_off_allocations.update({
            where: { id: alloc.id },
            data: {
              used_days: newUsedDays,
              updated_at: new Date(),
            },
          });
        }
      }

      const updated = await tx.time_off_requests.update({
        where: { id },
        data: {
          state: "refused",
          refused_by: session.user.id,
          refused_at: new Date(),
          refusal_reason: String(refusalReason).trim(),
          updated_at: new Date(),
        },
        include: {
          employees: {
            include: {
              departments_employees_department_idTodepartments: true,
              employees: true,
            },
          },
          time_off_types: true,
          time_off_allocations: true,
          users_time_off_requests_approved_byTousers: true,
          users_time_off_requests_refused_byTousers: true,
        },
      });

      return updated;
    });

    await logTimeOffAudit(
      session.user.id,
      "REFUSE_REQUEST",
      "time_off_requests",
      id,
      { state: existingRequest.state },
      { state: "refused", refused_by: session.user.id, refusal_reason: refusalReason }
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time off request refused successfully.",
        data: formatTimeOffRequestPayload(result),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/time-off/requests/[id]/refuse error:", error);
    return jsonCorsResponse(
      { success: false, error: "Failed to refuse time off request: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

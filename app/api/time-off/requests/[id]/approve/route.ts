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
 * POST /api/time-off/requests/[id]/approve
 * Approves a time off request with transactional allocation balance updating and double approval prevention.
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
    const canApprove = session.isAdmin || isManager;

    if (!canApprove) {
      return jsonCorsResponse(
        { success: false, error: "Unauthorized. Only managers or HR/Admin can approve leave requests." },
        { status: 403 },
        req
      );
    }

    // Prevent double approval
    if (existingRequest.state === "approved") {
      return jsonCorsResponse(
        { success: false, error: "Time off request is already approved." },
        { status: 409 },
        req
      );
    }

    if (existingRequest.state === "refused" || existingRequest.state === "cancelled") {
      return jsonCorsResponse(
        { success: false, error: `Cannot approve a request that is currently in state '${existingRequest.state}'.` },
        { status: 409 },
        req
      );
    }

    const numDays = Number(existingRequest.number_of_days);

    // Execute approval inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      let allocId = existingRequest.allocation_id;

      // Find suitable allocation if none linked
      if (!allocId) {
        const alloc = await tx.time_off_allocations.findFirst({
          where: {
            employee_id: existingRequest.employee_id,
            time_off_type_id: existingRequest.time_off_type_id,
            state: "approved",
            validity_start: { lte: existingRequest.date_from },
            validity_end: { gte: existingRequest.date_to },
          },
          orderBy: [{ validity_end: "asc" }],
        });
        if (alloc) allocId = alloc.id;
      }

      if (allocId) {
        const alloc = await tx.time_off_allocations.findUnique({
          where: { id: allocId },
        });

        if (alloc) {
          const allocDays = Number(alloc.allocated_days || 0);
          const usedDays = Number(alloc.used_days || 0);
          const remDays = alloc.remaining_days !== null ? Number(alloc.remaining_days) : Math.max(0, allocDays - usedDays);

          if (remDays < numDays) {
            throw new Error(`Insufficient leave balance in allocation. Remaining balance is ${remDays} days, but requested is ${numDays} days.`);
          }

          const newUsed = usedDays + numDays;
          const newRemaining = Math.max(0, allocDays - newUsed);

          await tx.time_off_allocations.update({
            where: { id: alloc.id },
            data: {
              used_days: newUsed,
              updated_at: new Date(),
            },
          });
        }
      }

      const updated = await tx.time_off_requests.update({
        where: { id },
        data: {
          allocation_id: allocId,
          state: "approved",
          approved_by: session.user.id,
          approved_at: new Date(),
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
      "APPROVE_REQUEST",
      "time_off_requests",
      id,
      { state: existingRequest.state },
      { state: "approved", approved_by: session.user.id }
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time off request approved successfully.",
        data: formatTimeOffRequestPayload(result),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/time-off/requests/[id]/approve error:", error);
    const statusCode = error?.message?.includes("Insufficient leave balance") ? 409 : 500;
    return jsonCorsResponse(
      { success: false, error: error?.message || "Failed to approve time off request." },
      { status: statusCode },
      req
    );
  }
}

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
 * GET /api/time-off/requests/[id]
 * Fetch single time off request detail.
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
      return jsonCorsResponse({ success: false, error: "Invalid request ID" }, { status: 400 }, req);
    }

    const request = await prisma.time_off_requests.findUnique({
      where: { id },
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

    if (!request) {
      return jsonCorsResponse(
        { success: false, error: "Time off request not found." },
        { status: 404 },
        req
      );
    }

    // Authorization check
    if (!session.isAdmin) {
      const userEmployee = await prisma.employees.findFirst({
        where: {
          OR: [
            { user_id: session.user.id },
            { work_email: session.user.email },
          ],
        },
      });

      if (!userEmployee || userEmployee.id !== request.employee_id) {
        const managedIds = await getUserManagedEmployeeIds(session.user.id);
        if (!managedIds.includes(request.employee_id)) {
          return jsonCorsResponse(
            { success: false, error: "Unauthorized to view this request." },
            { status: 403 },
            req
          );
        }
      }
    }

    return jsonCorsResponse(
      {
        success: true,
        data: formatTimeOffRequestPayload(request),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("GET /api/time-off/requests/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * PATCH /api/time-off/requests/[id]
 * Update time off request (or perform approve/refuse action).
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

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid request ID" }, { status: 400 }, req);
    }

    const body = await req.json();
    const { action, state, reason, refusal_reason, refusalReason, date_from, dateFrom, date_to, dateTo, number_of_days, numberOfDays } = body;

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

    // Check manager / HR / owner rights
    const userEmployee = await prisma.employees.findFirst({
      where: {
        OR: [
          { user_id: session.user.id },
          { work_email: session.user.email },
        ],
      },
    });

    const isOwner = userEmployee && userEmployee.id === existingRequest.employee_id;
    const managedIds = await getUserManagedEmployeeIds(session.user.id);
    const isManager = managedIds.includes(existingRequest.employee_id);
    const canManage = session.isAdmin || isManager;

    // Direct approve / refuse action trigger
    if (action === "approve" || state === "approved") {
      if (!canManage) {
        return jsonCorsResponse(
          { success: false, error: "Unauthorized. Only managers or HR/Admin can approve requests." },
          { status: 403 },
          req
        );
      }

      if (existingRequest.state === "approved") {
        return jsonCorsResponse(
          { success: false, error: "Request is already approved." },
          { status: 409 },
          req
        );
      }

      if (existingRequest.state === "refused" || existingRequest.state === "cancelled") {
        return jsonCorsResponse(
          { success: false, error: `Cannot approve a request that is currently ${existingRequest.state}.` },
          { status: 409 },
          req
        );
      }

      const leaveType = existingRequest.time_off_types;
      const numDays = Number(existingRequest.number_of_days);

      // Execute approval transaction
      const result = await prisma.$transaction(async (tx) => {
        let allocationIdToUse = existingRequest.allocation_id;

        // Verify allocation balance if applicable
        if (allocationIdToUse) {
          const alloc = await tx.time_off_allocations.findUnique({
            where: { id: allocationIdToUse },
          });

          if (alloc) {
            const allocDays = Number(alloc.allocated_days || 0);
            const usedDays = Number(alloc.used_days || 0);
            const remDays = alloc.remaining_days !== null ? Number(alloc.remaining_days) : Math.max(0, allocDays - usedDays);

            if (remDays < numDays) {
              throw new Error(`Insufficient leave balance in allocation. Remaining: ${remDays} days, Requested: ${numDays} days.`);
            }

            const newUsedDays = usedDays + numDays;
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
    }

    if (action === "refuse" || state === "refused") {
      if (!canManage) {
        return jsonCorsResponse(
          { success: false, error: "Unauthorized. Only managers or HR/Admin can refuse requests." },
          { status: 403 },
          req
        );
      }

      if (existingRequest.state === "refused") {
        return jsonCorsResponse(
          { success: false, error: "Request is already refused." },
          { status: 409 },
          req
        );
      }

      const refusalMsg = refusal_reason || refusalReason || reason || "Request refused by approver.";

      const result = await prisma.$transaction(async (tx) => {
        // If request was previously approved, restore allocation balance
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
            refusal_reason: String(refusalMsg).trim(),
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
        { state: "refused", refused_by: session.user.id, refusal_reason: refusalMsg }
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
    }

    // Standard updates (e.g. modifying dates or reason for draft/submitted requests)
    if (!isOwner && !canManage) {
      return jsonCorsResponse(
        { success: false, error: "Unauthorized to update this request." },
        { status: 403 },
        req
      );
    }

    if (existingRequest.state === "approved" && !canManage) {
      return jsonCorsResponse(
        { success: false, error: "Cannot modify an approved request." },
        { status: 409 },
        req
      );
    }

    const updateData: any = {};
    if (reason !== undefined) updateData.reason = reason ? String(reason).trim() : null;
    if (state && ["draft", "submitted", "cancelled"].includes(state)) updateData.state = state;

    const rawDateFrom = date_from || dateFrom;
    const rawDateTo = date_to || dateTo;
    if (rawDateFrom || rawDateTo) {
      const dFrom = new Date(rawDateFrom || existingRequest.date_from);
      const dTo = new Date(rawDateTo || existingRequest.date_to);
      if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) {
        return jsonCorsResponse(
          { success: false, error: "Invalid date format." },
          { status: 422 },
          req
        );
      }
      if (dTo < dFrom) {
        return jsonCorsResponse(
          { success: false, error: "End date cannot be before start date." },
          { status: 422 },
          req
        );
      }
      updateData.date_from = dFrom;
      updateData.date_to = dTo;

      const specifiedDays = parseFloat(number_of_days || numberOfDays);
      if (!isNaN(specifiedDays) && specifiedDays > 0) {
        updateData.number_of_days = specifiedDays;
      } else {
        const diffMs = Math.abs(dTo.getTime() - dFrom.getTime());
        updateData.number_of_days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
      }
    }

    updateData.updated_at = new Date();

    const updated = await prisma.time_off_requests.update({
      where: { id },
      data: updateData,
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

    await logTimeOffAudit(
      session.user.id,
      "UPDATE_REQUEST",
      "time_off_requests",
      id,
      existingRequest,
      updateData
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time off request updated successfully.",
        data: formatTimeOffRequestPayload(updated),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("PATCH /api/time-off/requests/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * DELETE /api/time-off/requests/[id]
 * Delete or cancel a time off request. Reverts balance if previously approved.
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

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return jsonCorsResponse({ success: false, error: "Invalid request ID" }, { status: 400 }, req);
    }

    const existingRequest = await prisma.time_off_requests.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return jsonCorsResponse(
        { success: false, error: "Time off request not found." },
        { status: 404 },
        req
      );
    }

    const userEmployee = await prisma.employees.findFirst({
      where: {
        OR: [
          { user_id: session.user.id },
          { work_email: session.user.email },
        ],
      },
    });

    const isOwner = userEmployee && userEmployee.id === existingRequest.employee_id;
    const managedIds = await getUserManagedEmployeeIds(session.user.id);
    const isManager = managedIds.includes(existingRequest.employee_id);
    const canDelete = session.isAdmin || isManager || (isOwner && ["draft", "submitted"].includes(existingRequest.state));

    if (!canDelete) {
      return jsonCorsResponse(
        { success: false, error: "Unauthorized to delete this request." },
        { status: 403 },
        req
      );
    }

    await prisma.$transaction(async (tx) => {
      // If approved, restore allocation balance
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

      await tx.time_off_requests.delete({
        where: { id },
      });
    });

    await logTimeOffAudit(
      session.user.id,
      "DELETE_REQUEST",
      "time_off_requests",
      id,
      existingRequest,
      null
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time off request deleted successfully.",
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error("DELETE /api/time-off/requests/[id] error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

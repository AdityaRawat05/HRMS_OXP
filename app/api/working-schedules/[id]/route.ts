import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  formatSchedulePayload,
  logAuditAction,
} from "@/lib/working-schedules";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

/**
 * GET /api/working-schedules/[id]
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

    const scheduleId = parseInt(params.id, 10);
    if (isNaN(scheduleId) || scheduleId <= 0) {
      return jsonCorsResponse({ success: false, error: "Invalid schedule ID" }, { status: 400 }, req);
    }

    const schedule = await prisma.working_schedules.findUnique({
      where: { id: scheduleId },
      include: {
        companies: true,
        working_schedule_lines: {
          orderBy: { day_of_week: "asc" },
        },
      },
    });

    if (!schedule) {
      return jsonCorsResponse({ success: false, error: "Working schedule not found" }, { status: 404 }, req);
    }

    return jsonCorsResponse(
      {
        success: true,
        data: formatSchedulePayload(schedule),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error(`GET /api/working-schedules/${params.id} error:`, error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * PATCH /api/working-schedules/[id]
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const scheduleId = parseInt(params.id, 10);
    if (isNaN(scheduleId) || scheduleId <= 0) {
      return jsonCorsResponse({ success: false, error: "Invalid schedule ID" }, { status: 400 }, req);
    }

    const existingSchedule = await prisma.working_schedules.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      return jsonCorsResponse({ success: false, error: "Working schedule not found" }, { status: 404 }, req);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid JSON body" }, { status: 400 }, req);
    }

    const { name, company_id, timezone, is_default, is_active } = body;

    const updateData: any = {
      updated_at: new Date(),
    };

    let targetCompanyId = existingSchedule.company_id;
    if (company_id !== undefined && company_id !== null) {
      const cId = parseInt(String(company_id), 10);
      if (isNaN(cId) || cId <= 0) {
        return jsonCorsResponse({ success: false, error: "Invalid company_id provided." }, { status: 422 }, req);
      }
      const company = await prisma.companies.findUnique({ where: { id: cId } });
      if (!company) {
        return jsonCorsResponse({ success: false, error: `Company with ID ${cId} not found.` }, { status: 404 }, req);
      }
      updateData.company_id = cId;
      targetCompanyId = cId;
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return jsonCorsResponse({ success: false, error: "Schedule name cannot be empty." }, { status: 422 }, req);
      }
      const trimmedName = name.trim();

      // Check unique constraint if name or company changed
      if (trimmedName !== existingSchedule.name || targetCompanyId !== existingSchedule.company_id) {
        const conflict = await prisma.working_schedules.findFirst({
          where: {
            company_id: targetCompanyId,
            name: trimmedName,
            id: { not: scheduleId },
          },
        });
        if (conflict) {
          return jsonCorsResponse(
            { success: false, error: `Working schedule named "${trimmedName}" already exists for this company.` },
            { status: 409 },
            req
          );
        }
      }
      updateData.name = trimmedName;
    }

    if (timezone !== undefined) {
      if (typeof timezone !== "string" || !timezone.trim()) {
        return jsonCorsResponse({ success: false, error: "Timezone cannot be empty." }, { status: 422 }, req);
      }
      updateData.timezone = timezone.trim();
    }

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }

    if (is_default !== undefined) {
      updateData.is_default = Boolean(is_default);
    }

    const updatedSchedule = await prisma.$transaction(async (tx) => {
      if (updateData.is_default) {
        await tx.working_schedules.updateMany({
          where: { company_id: targetCompanyId, is_default: true, id: { not: scheduleId } },
          data: { is_default: false },
        });
      }

      return tx.working_schedules.update({
        where: { id: scheduleId },
        data: updateData,
      });
    });

    await logAuditAction(
      auth.sessionData.user.id,
      "UPDATE",
      scheduleId,
      existingSchedule,
      updatedSchedule
    );

    const fullSchedule = await prisma.working_schedules.findUnique({
      where: { id: scheduleId },
      include: {
        companies: true,
        working_schedule_lines: {
          orderBy: { day_of_week: "asc" },
        },
      },
    });

    return jsonCorsResponse(
      {
        success: true,
        data: formatSchedulePayload(fullSchedule),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error(`PATCH /api/working-schedules/${params.id} error:`, error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * DELETE /api/working-schedules/[id]
 * Deletes or deactivates working schedule depending on contract dependencies.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const scheduleId = parseInt(params.id, 10);
    if (isNaN(scheduleId) || scheduleId <= 0) {
      return jsonCorsResponse({ success: false, error: "Invalid schedule ID" }, { status: 400 }, req);
    }

    const existingSchedule = await prisma.working_schedules.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      return jsonCorsResponse({ success: false, error: "Working schedule not found" }, { status: 404 }, req);
    }

    // Check if any contracts are using this schedule
    const contractCount = await prisma.employee_contracts.count({
      where: { working_schedule_id: scheduleId },
    });

    if (contractCount > 0) {
      // Deactivate instead of hard deleting to prevent breaking employee records
      await prisma.working_schedules.update({
        where: { id: scheduleId },
        data: { is_active: false, updated_at: new Date() },
      });

      await logAuditAction(auth.sessionData.user.id, "DEACTIVATE", scheduleId, existingSchedule, {
        is_active: false,
        reason: `Deactivated because ${contractCount} employee contract(s) reference this schedule.`,
      });

      return jsonCorsResponse(
        {
          success: true,
          message: `Schedule deactivated because ${contractCount} employee contract(s) reference it.`,
          deactivated: true,
        },
        { status: 200 },
        req
      );
    }

    // Safe to hard delete (lines are deleted via cascade in DB)
    await prisma.working_schedules.delete({
      where: { id: scheduleId },
    });

    await logAuditAction(auth.sessionData.user.id, "DELETE", scheduleId, existingSchedule, null);

    return jsonCorsResponse(
      {
        success: true,
        message: "Working schedule deleted successfully.",
        deleted: true,
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error(`DELETE /api/working-schedules/${params.id} error:`, error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

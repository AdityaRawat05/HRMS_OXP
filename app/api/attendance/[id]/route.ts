import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { jsonCorsResponse, handleOptions } from "@/lib/cors";
import {
  formatAttendancePayload,
  calculateWorkedAndOvertime,
  logAttendanceAudit,
} from "@/lib/attendance";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

function parseBigIntId(idStr: string): bigint | null {
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

/**
 * GET /api/attendance/[id]
 * Attendance Detail endpoint.
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

    const recordId = parseBigIntId(params.id);
    if (!recordId) {
      return jsonCorsResponse({ success: false, error: "Invalid attendance ID" }, { status: 400 }, req);
    }

    const record = await prisma.attendance_records.findUnique({
      where: { id: recordId },
      include: {
        employees: {
          include: {
            departments_employees_department_idTodepartments: true,
            employees: true,
          },
        },
      },
    });

    if (!record) {
      return jsonCorsResponse({ success: false, error: "Attendance record not found" }, { status: 404 }, req);
    }

    // RBAC Scope Check
    if (!session.isAdmin) {
      const emp = await prisma.employees.findFirst({
        where: { user_id: session.user.id },
      });
      if (!emp || emp.id !== record.employee_id) {
        return jsonCorsResponse(
          { success: false, error: "Forbidden. You can only view your own attendance records." },
          { status: 403 },
          req
        );
      }
    }

    return jsonCorsResponse(
      {
        success: true,
        data: formatAttendancePayload(record),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error(`GET /api/attendance/${params.id} error:`, error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * PATCH /api/attendance/[id]
 * Update or manually correct an attendance record (Admin/HR feature).
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

    const recordId = parseBigIntId(params.id);
    if (!recordId) {
      return jsonCorsResponse({ success: false, error: "Invalid attendance ID" }, { status: 400 }, req);
    }

    const existingRecord = await prisma.attendance_records.findUnique({
      where: { id: recordId },
    });

    if (!existingRecord) {
      return jsonCorsResponse({ success: false, error: "Attendance record not found" }, { status: 404 }, req);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonCorsResponse({ success: false, error: "Invalid JSON body" }, { status: 400 }, req);
    }

    const {
      check_in,
      check_out,
      status,
      worked_hours,
      overtime_hours,
      break_hours,
      correction_reason,
      notes,
    } = body;

    const updateData: any = {
      updated_at: new Date(),
    };

    let checkInDate = existingRecord.check_in;
    if (check_in !== undefined && check_in !== null) {
      const d = new Date(check_in);
      if (isNaN(d.getTime())) {
        return jsonCorsResponse({ success: false, error: "Invalid check_in timestamp." }, { status: 422 }, req);
      }
      checkInDate = d;
      updateData.check_in = checkInDate;
    }

    let checkOutDate = existingRecord.check_out;
    if (check_out !== undefined) {
      if (check_out === null) {
        checkOutDate = null;
        updateData.check_out = null;
      } else {
        const d = new Date(check_out);
        if (isNaN(d.getTime())) {
          return jsonCorsResponse({ success: false, error: "Invalid check_out timestamp." }, { status: 422 }, req);
        }
        checkOutDate = d;
        updateData.check_out = checkOutDate;
      }
    }

    if (checkOutDate && checkInDate && checkOutDate.getTime() < checkInDate.getTime()) {
      return jsonCorsResponse(
        { success: false, error: "Check-out cannot be before check-in." },
        { status: 422 },
        req
      );
    }

    let bHours = Number(existingRecord.break_hours || 0);
    if (break_hours !== undefined && break_hours !== null) {
      bHours = parseFloat(String(break_hours));
      if (isNaN(bHours) || bHours < 0) {
        return jsonCorsResponse({ success: false, error: "Break hours cannot be negative." }, { status: 422 }, req);
      }
      updateData.break_hours = bHours;
    }

    if (worked_hours !== undefined && worked_hours !== null) {
      const wH = parseFloat(String(worked_hours));
      if (isNaN(wH) || wH < 0) {
        return jsonCorsResponse({ success: false, error: "Worked hours cannot be negative." }, { status: 422 }, req);
      }
      updateData.worked_hours = wH;
    } else if (checkOutDate && checkInDate) {
      const calc = calculateWorkedAndOvertime(checkInDate, checkOutDate, bHours);
      updateData.worked_hours = calc.workedHours;
      if (overtime_hours === undefined) {
        updateData.overtime_hours = calc.overtimeHours;
      }
    }

    if (overtime_hours !== undefined && overtime_hours !== null) {
      const otH = parseFloat(String(overtime_hours));
      if (isNaN(otH) || otH < 0) {
        return jsonCorsResponse({ success: false, error: "Overtime hours cannot be negative." }, { status: 422 }, req);
      }
      updateData.overtime_hours = otH;
    }

    if (status !== undefined && status !== null) {
      updateData.status = status;
    }

    const reasonText = correction_reason || notes;
    if (reasonText !== undefined) {
      updateData.correction_reason = reasonText;
      updateData.is_manually_corrected = true;
      updateData.corrected_by = auth.sessionData.user.id;
    }

    const updatedRecord = await prisma.attendance_records.update({
      where: { id: recordId },
      data: updateData,
    });

    await logAttendanceAudit(auth.sessionData.user.id, "UPDATE", recordId, existingRecord, updatedRecord);

    const fullRecord = await prisma.attendance_records.findUnique({
      where: { id: recordId },
      include: {
        employees: {
          include: {
            departments_employees_department_idTodepartments: true,
            employees: true,
          },
        },
      },
    });

    return jsonCorsResponse(
      {
        success: true,
        data: formatAttendancePayload(fullRecord),
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error(`PATCH /api/attendance/${params.id} error:`, error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * DELETE /api/attendance/[id]
 * Delete attendance record (Admin/HR feature).
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

    const recordId = parseBigIntId(params.id);
    if (!recordId) {
      return jsonCorsResponse({ success: false, error: "Invalid attendance ID" }, { status: 400 }, req);
    }

    const existingRecord = await prisma.attendance_records.findUnique({
      where: { id: recordId },
    });

    if (!existingRecord) {
      return jsonCorsResponse({ success: false, error: "Attendance record not found" }, { status: 404 }, req);
    }

    await prisma.attendance_records.delete({
      where: { id: recordId },
    });

    await logAttendanceAudit(auth.sessionData.user.id, "DELETE", recordId, existingRecord, null);

    return jsonCorsResponse(
      {
        success: true,
        message: "Attendance record deleted successfully.",
      },
      { status: 200 },
      req
    );
  } catch (error: any) {
    console.error(`DELETE /api/attendance/${params.id} error:`, error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

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
 * GET /api/time-off/requests
 * List time off requests with search, employee, type, status, and My Team filters.
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const employeeIdParam = searchParams.get("employeeId") || searchParams.get("employee_id");
    const timeOffTypeIdParam = searchParams.get("timeOffTypeId") || searchParams.get("time_off_type_id");
    const statusParam = searchParams.get("status") || searchParams.get("state");
    const dateParam = searchParams.get("date");
    const dateFromParam = searchParams.get("date_from") || searchParams.get("dateFrom");
    const dateToParam = searchParams.get("date_to") || searchParams.get("dateTo");
    const isMyTeam = searchParams.get("myTeam") === "true" || searchParams.get("is_my_team") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    // Find authenticated user's employee record
    const userEmployee = await prisma.employees.findFirst({
      where: {
        OR: [
          { user_id: session.user.id },
          { work_email: session.user.email },
        ],
      },
    });

    const where: any = {};

    // RBAC & Team Filter Scoping
    if (isMyTeam) {
      const managedIds = await getUserManagedEmployeeIds(session.user.id);
      where.employee_id = { in: managedIds };
    } else if (!session.isAdmin) {
      // Non-admin standard employee can only view their own requests unless filtering my team
      if (userEmployee) {
        where.employee_id = userEmployee.id;
      } else {
        return jsonCorsResponse(
          {
            success: true,
            data: [],
            pagination: { page: 1, limit, total: 0, totalPages: 0 },
          },
          { status: 200 },
          req
        );
      }
    }

    // Specific employee filter override
    if (employeeIdParam) {
      const empId = parseInt(employeeIdParam, 10);
      if (!isNaN(empId)) {
        // If not admin and requested employee is not self/managed, enforce security
        if (!session.isAdmin && userEmployee && userEmployee.id !== empId) {
          const managedIds = await getUserManagedEmployeeIds(session.user.id);
          if (!managedIds.includes(empId)) {
            return jsonCorsResponse(
              { success: false, error: "Unauthorized to view this employee's requests." },
              { status: 403 },
              req
            );
          }
        }
        where.employee_id = empId;
      }
    }

    // Leave Type filter
    if (timeOffTypeIdParam) {
      const typeId = parseInt(timeOffTypeIdParam, 10);
      if (!isNaN(typeId)) {
        where.time_off_type_id = typeId;
      }
    }

    // Status / State filter
    if (statusParam && statusParam !== "all") {
      where.state = statusParam;
    }

    // Date filters
    if (dateParam) {
      const targetDate = new Date(dateParam);
      if (!isNaN(targetDate.getTime())) {
        where.date_from = { lte: targetDate };
        where.date_to = { gte: targetDate };
      }
    } else if (dateFromParam || dateToParam) {
      if (dateFromParam && dateToParam) {
        const dFrom = new Date(dateFromParam);
        const dTo = new Date(dateToParam);
        if (!isNaN(dFrom.getTime()) && !isNaN(dTo.getTime())) {
          where.date_from = { lte: dTo };
          where.date_to = { gte: dFrom };
        }
      } else if (dateFromParam) {
        const dFrom = new Date(dateFromParam);
        if (!isNaN(dFrom.getTime())) {
          where.date_to = { gte: dFrom };
        }
      } else if (dateToParam) {
        const dTo = new Date(dateToParam);
        if (!isNaN(dTo.getTime())) {
          where.date_from = { lte: dTo };
        }
      }
    }

    // Search filter
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { reason: { contains: q } },
        { time_off_types: { name: { contains: q } } },
        {
          employees: {
            OR: [
              { first_name: { contains: q } },
              { last_name: { contains: q } },
              { employee_code: { contains: q } },
              { work_email: { contains: q } },
            ],
          },
        },
      ];
    }

    const [total, records] = await Promise.all([
      prisma.time_off_requests.count({ where }),
      prisma.time_off_requests.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ created_at: "desc" }],
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
      }),
    ]);

    const formattedData = records.map(formatTimeOffRequestPayload);

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
    console.error("GET /api/time-off/requests error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

/**
 * POST /api/time-off/requests
 * Create a new time off request with validation and allocation balance check.
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return jsonCorsResponse({ success: false, error: "Not authenticated" }, { status: 401 }, req);
    }

    const body = await req.json();
    const {
      time_off_type_id,
      timeOffTypeId,
      employee_id,
      employeeId,
      date_from,
      dateFrom,
      startDate,
      date_to,
      dateTo,
      endDate,
      number_of_days,
      numberOfDays,
      duration,
      reason,
      document_url,
      documentUrl,
      state,
    } = body;

    const targetTypeId = parseInt(time_off_type_id || timeOffTypeId, 10);
    const rawDateFrom = date_from || dateFrom || startDate;
    const rawDateTo = date_to || dateTo || endDate;

    if (!targetTypeId || isNaN(targetTypeId)) {
      return jsonCorsResponse(
        { success: false, error: "Time Off Type ID is required." },
        { status: 422 },
        req
      );
    }

    if (!rawDateFrom || !rawDateTo) {
      return jsonCorsResponse(
        { success: false, error: "Start date and end date are required." },
        { status: 422 },
        req
      );
    }

    const dFrom = new Date(rawDateFrom);
    const dTo = new Date(rawDateTo);

    if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) {
      return jsonCorsResponse(
        { success: false, error: "Invalid date format for start date or end date." },
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

    // Resolve employee
    const userEmployee = await prisma.employees.findFirst({
      where: {
        OR: [
          { user_id: session.user.id },
          { work_email: session.user.email },
        ],
      },
    });

    let targetEmployeeId: number | null = null;
    const requestedEmpId = parseInt(employee_id || employeeId, 10);

    if (requestedEmpId && !isNaN(requestedEmpId)) {
      if (!session.isAdmin && userEmployee && userEmployee.id !== requestedEmpId) {
        const managedIds = await getUserManagedEmployeeIds(session.user.id);
        if (!managedIds.includes(requestedEmpId)) {
          return jsonCorsResponse(
            { success: false, error: "Unauthorized to submit request for another employee." },
            { status: 403 },
            req
          );
        }
      }
      targetEmployeeId = requestedEmpId;
    } else {
      if (!userEmployee) {
        return jsonCorsResponse(
          { success: false, error: "No employee record associated with logged in user." },
          { status: 404 },
          req
        );
      }
      targetEmployeeId = userEmployee.id;
    }

    // Verify employee exists and is active
    const targetEmployee = await prisma.employees.findUnique({
      where: { id: targetEmployeeId },
    });

    if (!targetEmployee || !targetEmployee.is_active) {
      return jsonCorsResponse(
        { success: false, error: "Employee record not found or inactive." },
        { status: 404 },
        req
      );
    }

    // Verify Time Off Type exists and is active
    const leaveType = await prisma.time_off_types.findUnique({
      where: { id: targetTypeId },
    });

    if (!leaveType || !leaveType.is_active) {
      return jsonCorsResponse(
        { success: false, error: "Time Off Type not found or inactive." },
        { status: 404 },
        req
      );
    }

    // Calculate duration in days (inclusive of start and end date)
    let calculatedDuration = 0;
    const specifiedDays = parseFloat(number_of_days || numberOfDays || duration);
    if (!isNaN(specifiedDays) && specifiedDays > 0) {
      calculatedDuration = specifiedDays;
    } else {
      const diffMs = Math.abs(dTo.getTime() - dFrom.getTime());
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
      calculatedDuration = diffDays;
    }

    // Max consecutive days check
    if (leaveType.max_consecutive_days && calculatedDuration > leaveType.max_consecutive_days) {
      return jsonCorsResponse(
        {
          success: false,
          error: `Request duration (${calculatedDuration} days) exceeds maximum allowed consecutive days (${leaveType.max_consecutive_days} days) for ${leaveType.name}.`,
        },
        { status: 422 },
        req
      );
    }

    // Allocation balance check if leave type requires allocation/approval
    let allocationIdToLink: number | null = null;

    const availableAllocations = await prisma.time_off_allocations.findMany({
      where: {
        employee_id: targetEmployeeId,
        time_off_type_id: targetTypeId,
        state: "approved",
        validity_start: { lte: dFrom },
        validity_end: { gte: dTo },
      },
      orderBy: [{ validity_end: "asc" }],
    });

    let totalAvailableBalance = 0;
    for (const alloc of availableAllocations) {
      const allocDays = Number(alloc.allocated_days || 0);
      const usedDays = Number(alloc.used_days || 0);
      const remDays = alloc.remaining_days !== null ? Number(alloc.remaining_days) : Math.max(0, allocDays - usedDays);
      totalAvailableBalance += remDays;
      if (!allocationIdToLink && remDays >= calculatedDuration) {
        allocationIdToLink = alloc.id;
      }
    }

    if (!allocationIdToLink && availableAllocations.length > 0) {
      allocationIdToLink = availableAllocations[0].id;
    }

    // If leave type requires document check
    if (leaveType.requires_document && (!document_url && !documentUrl)) {
      // Optional flag, warn or enforce if strict
    }

    // Overlapping request check
    const overlappingRequest = await prisma.time_off_requests.findFirst({
      where: {
        employee_id: targetEmployeeId,
        state: { in: ["submitted", "approved", "draft"] },
        date_from: { lte: dTo },
        date_to: { gte: dFrom },
      },
    });

    if (overlappingRequest) {
      return jsonCorsResponse(
        {
          success: false,
          error: "An overlapping time off request already exists for this date range.",
        },
        { status: 409 },
        req
      );
    }

    const requestState = (state && ["draft", "submitted"].includes(state)) ? state : "submitted";

    const newRequest = await prisma.time_off_requests.create({
      data: {
        employee_id: targetEmployeeId,
        time_off_type_id: targetTypeId,
        allocation_id: allocationIdToLink,
        date_from: dFrom,
        date_to: dTo,
        number_of_days: calculatedDuration,
        reason: reason ? String(reason).trim() : null,
        document_url: document_url || documentUrl || null,
        state: requestState,
        submitted_at: requestState === "submitted" ? new Date() : null,
        created_by: session.user.id,
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

    await logTimeOffAudit(
      session.user.id,
      "CREATE_REQUEST",
      "time_off_requests",
      newRequest.id,
      null,
      { employee_id: targetEmployeeId, time_off_type_id: targetTypeId, number_of_days: calculatedDuration, state: requestState }
    );

    return jsonCorsResponse(
      {
        success: true,
        message: "Time off request created successfully.",
        data: formatTimeOffRequestPayload(newRequest),
      },
      { status: 201 },
      req
    );
  } catch (error: any) {
    console.error("POST /api/time-off/requests error:", error);
    return jsonCorsResponse(
      { success: false, error: "Internal server error: " + (error?.message || "Unknown error") },
      { status: 500 },
      req
    );
  }
}

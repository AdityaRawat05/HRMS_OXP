import { prisma } from "@/lib/prisma";

export function formatTimeOffTypePayload(type: any) {
  return {
    id: type.id,
    company_id: type.company_id,
    name: type.name,
    code: type.code,
    color: type.color || "#3498db",
    leave_unit: type.leave_unit || "days",
    requires_approval: Boolean(type.requires_approval),
    requires_document: Boolean(type.requires_document),
    max_consecutive_days: type.max_consecutive_days || null,
    is_paid: Boolean(type.is_paid),
    affects_payroll: Boolean(type.affects_payroll),
    is_active: Boolean(type.is_active),
    created_at: type.created_at,
    updated_at: type.updated_at,
  };
}

export function formatTimeOffAllocationPayload(alloc: any) {
  const emp = alloc.employees;
  const type = alloc.time_off_types;
  const approver = alloc.users;

  const empName = emp
    ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
    : "Unknown Employee";

  const approverName = approver
    ? `${approver.first_name || ""} ${approver.last_name || ""}`.trim()
    : null;

  const allocated = alloc.allocated_days !== null && alloc.allocated_days !== undefined
    ? Number(alloc.allocated_days)
    : 0;

  const used = alloc.used_days !== null && alloc.used_days !== undefined
    ? Number(alloc.used_days)
    : 0;

  const remaining = alloc.remaining_days !== null && alloc.remaining_days !== undefined
    ? Number(alloc.remaining_days)
    : Math.max(0, allocated - used);

  const valStartStr = alloc.validity_start
    ? new Date(alloc.validity_start).toISOString().split("T")[0]
    : "";

  const valEndStr = alloc.validity_end
    ? new Date(alloc.validity_end).toISOString().split("T")[0]
    : "";

  return {
    id: alloc.id,
    employee_id: alloc.employee_id,
    employee_name: empName,
    employee: emp
      ? {
          id: emp.id,
          name: empName,
          first_name: emp.first_name || "",
          last_name: emp.last_name || "",
          employee_code: emp.employee_code || "",
          work_email: emp.work_email || "",
          avatar_url: emp.avatar_url || null,
        }
      : null,
    time_off_type_id: alloc.time_off_type_id,
    time_off_type: type ? formatTimeOffTypePayload(type) : null,
    allocation_type: alloc.allocation_type,
    allocated_days: allocated,
    used_days: used,
    taken_days: used,
    remaining_days: remaining,
    validity_start: valStartStr,
    validity_end: valEndStr,
    state: alloc.state,
    status: alloc.state,
    approved_by: alloc.approved_by,
    approved_by_name: approverName,
    approved_at: alloc.approved_at,
    notes: alloc.notes || null,
    created_by: alloc.created_by,
    created_at: alloc.created_at,
    updated_at: alloc.updated_at,
  };
}

export function formatTimeOffRequestPayload(req: any) {
  const emp = req.employees;
  const dept = emp?.departments_employees_department_idTodepartments;
  const type = req.time_off_types;
  const alloc = req.time_off_allocations;
  const approver = req.users_time_off_requests_approved_byTousers;
  const refuser = req.users_time_off_requests_refused_byTousers;

  const empName = emp
    ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim()
    : "Unknown Employee";

  const approverName = approver
    ? `${approver.first_name || ""} ${approver.last_name || ""}`.trim()
    : null;

  const refuserName = refuser
    ? `${refuser.first_name || ""} ${refuser.last_name || ""}`.trim()
    : null;

  const dateFromStr = req.date_from
    ? new Date(req.date_from).toISOString().split("T")[0]
    : "";

  const dateToStr = req.date_to
    ? new Date(req.date_to).toISOString().split("T")[0]
    : "";

  const numDays = req.number_of_days !== null && req.number_of_days !== undefined
    ? Number(req.number_of_days)
    : 0;

  return {
    id: req.id,
    employee_id: req.employee_id,
    employee_name: empName,
    employee: emp
      ? {
          id: emp.id,
          name: empName,
          first_name: emp.first_name || "",
          last_name: emp.last_name || "",
          employee_code: emp.employee_code || "",
          work_email: emp.work_email || "",
          department: dept?.name || "Unassigned",
          avatar_url: emp.avatar_url || null,
        }
      : null,
    time_off_type_id: req.time_off_type_id,
    time_off_type: type ? formatTimeOffTypePayload(type) : null,
    allocation_id: req.allocation_id || null,
    allocation: alloc ? formatTimeOffAllocationPayload(alloc) : null,
    date_from: dateFromStr,
    date_to: dateToStr,
    start_date: dateFromStr,
    end_date: dateToStr,
    number_of_days: numDays,
    duration: numDays,
    duration_display: `${numDays} ${type?.leave_unit || "Days"}`,
    reason: req.reason || null,
    document_url: req.document_url || null,
    state: req.state,
    status: req.state,
    submitted_at: req.submitted_at,
    approved_by: req.approved_by || null,
    approved_by_name: approverName,
    approved_at: req.approved_at || null,
    refused_by: req.refused_by || null,
    refused_by_name: refuserName,
    refused_at: req.refused_at || null,
    refusal_reason: req.refusal_reason || null,
    created_by: req.created_by,
    created_at: req.created_at,
    updated_at: req.updated_at,
  };
}

export async function getUserManagedEmployeeIds(userId: number): Promise<number[]> {
  try {
    const userEmployee = await prisma.employees.findFirst({
      where: {
        OR: [
          { user_id: userId },
        ],
      },
    });

    if (!userEmployee) return [];

    // Find direct reports
    const directReports = await prisma.employees.findMany({
      where: { manager_id: userEmployee.id, is_active: true },
      select: { id: true },
    });

    // Find departments managed by this employee
    const managedDepts = await prisma.departments.findMany({
      where: { manager_id: userEmployee.id, is_active: true },
      select: { id: true },
    });
    const deptIds = managedDepts.map((d) => d.id);

    const deptReports = deptIds.length > 0
      ? await prisma.employees.findMany({
          where: { department_id: { in: deptIds }, is_active: true },
          select: { id: true },
        })
      : [];

    const idsSet = new Set<number>();
    idsSet.add(userEmployee.id); // Include self
    directReports.forEach((r) => idsSet.add(r.id));
    deptReports.forEach((r) => idsSet.add(r.id));

    return Array.from(idsSet);
  } catch (err) {
    console.error("Error getting user managed employee ids:", err);
    return [];
  }
}

export async function logTimeOffAudit(
  userId: number | undefined,
  action: string,
  entityType: string,
  entityId: number | bigint,
  oldValue?: any,
  newValue?: any
) {
  try {
    await prisma.audit_logs.create({
      data: {
        user_id: userId || null,
        action: action.substring(0, 30),
        entity_type: entityType,
        entity_id: BigInt(entityId),
        old_value: oldValue ? JSON.stringify(oldValue) : null,
        new_value: newValue ? JSON.stringify(newValue) : null,
      },
    });
  } catch (err) {
    console.error("Time off audit log error:", err);
  }
}

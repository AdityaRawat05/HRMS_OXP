export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  employee?: {
    id: number;
    name: string;
    employee_code?: string;
    work_email?: string;
  } | null;
}

export interface AuthSessionData {
  authenticated: boolean;
  user: UserProfile | null;
  roles: { id: number; name: string; display_name: string }[];
  permissions: string[];
  isAdmin: boolean;
}

export interface UserRecord {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  is_active: boolean;
  is_locked?: boolean;
  employee?: {
    id: number;
    name: string;
    employee_code?: string;
    work_email?: string;
  } | null;
  roles: {
    id: number;
    name: string;
    display_name: string;
  }[];
  primary_role?: string;
}

export interface RoleOption {
  id: number;
  name: string;
  display_name: string;
  description?: string;
}

export interface EmployeeOption {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  work_email: string | null;
  user_id: number | null;
}

export interface SignupRequestPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface UserCreatePayload {
  email: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  employee_id?: number | null;
  role_ids?: number[];
  is_active?: boolean;
}

export interface UserUpdatePayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  employee_id?: number | null;
  role_ids?: number[];
  is_active?: boolean;
}

const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
};

export interface PayrollPeriodRecord {
  id: number;
  company_id: number;
  company_name: string;
  name: string;
  date_from: string;
  date_to: string;
  state: "open" | "closed" | "locked";
  payrun_count?: number;
  payslip_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PayrunRecord {
  id: number;
  company_id: number;
  company_name: string;
  payroll_period_id: number;
  period_name: string;
  date_from: string;
  date_to: string;
  salary_structure_id: number;
  salary_structure_name: string;
  name: string;
  reference: string;
  state: "draft" | "computed" | "validated" | "paid" | "sent" | "cancelled";
  total_gross: string;
  total_deductions: string;
  total_net: string;
  payslip_count: number;
  has_warnings: boolean;
  warning_count: number;
  computed_at?: string | null;
  validated_at?: string | null;
  paid_at?: string | null;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayslipLineRecord {
  id: string;
  salary_rule_id: number;
  category_id: number;
  category_code?: string;
  category_name?: string;
  name: string;
  code: string;
  sequence: number;
  calculation_type: string;
  rate: string;
  base_amount: string;
  amount: string;
  is_contribution: boolean;
  appears_on_payslip: boolean;
}

export interface PayslipRecord {
  id: string;
  reference: string;
  employee_id: number;
  employee_code: string;
  employee_name: string;
  work_email?: string | null;
  bank_account_no?: string | null;
  contract_reference?: string | null;
  basic_salary: string;
  gross_salary: string;
  total_deductions: string;
  net_salary: string;
  days_worked: string;
  leave_days_taken?: string;
  overtime_hours?: string;
  state: "draft" | "computed" | "validated" | "paid" | "sent" | "cancelled";
  has_warnings: boolean;
  pdf_url?: string | null;
  lines?: PayslipLineRecord[];
}

export interface PayrunWarningRecord {
  id: string;
  payrun_id: number;
  payslip_id?: string | null;
  employee_id?: number | null;
  employee_name?: string | null;
  employee_code?: string | null;
  warning_type: string;
  severity: "info" | "warning" | "error";
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export interface PayrunDetailRecord extends PayrunRecord {
  currency_code: string;
  period_state: string;
  warnings: PayrunWarningRecord[];
  payslips: PayslipRecord[];
}

export interface EligibleEmployeeRecord {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  name: string;
  work_email: string | null;
  department: string;
  job_title: string;
  contract_id: number | null;
  contract_reference: string | null;
  wage_amount: string;
  wage_type: string;
  working_hours: string;
  hire_date: string;
  salary_structure_id: number | null;
  salary_structure_name: string;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: "include",
    });

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      return {
        success: false,
        error: data?.error || "Session expired. Please sign in again.",
      };
    }

    if (res.status === 403) {
      return {
        success: false,
        error: data?.error || "You do not have permission to access this resource.",
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `Request failed with status ${res.status}`,
      };
    }

    return data || { success: true };
  } catch (err: any) {
    console.error(`API Request Error [${endpoint}]:`, err);
    return {
      success: false,
      error: err.message || "Unable to connect to server.",
    };
  }
}

export async function loginApi(email: string, password: string): Promise<ApiResponse<AuthSessionData>> {
  return apiRequest<AuthSessionData>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutApi(): Promise<ApiResponse> {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUserApi(): Promise<ApiResponse<AuthSessionData>> {
  return apiRequest<AuthSessionData>("/api/auth/me", {
    method: "GET",
  });
}

export async function getUsersApi(search?: string, role?: string): Promise<ApiResponse<{ users: UserRecord[] }>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role && role !== "all") params.set("role", role);
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<{ users: UserRecord[] }>(`/api/users${queryString}`, {
    method: "GET",
  });
}

export async function getUserByIdApi(id: number): Promise<ApiResponse<{ user: UserRecord }>> {
  return apiRequest<{ user: UserRecord }>(`/api/users/${id}`, {
    method: "GET",
  });
}

export async function createUserApi(payload: UserCreatePayload): Promise<ApiResponse<{ user: UserRecord }>> {
  return apiRequest<{ user: UserRecord }>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUserApi(id: number, payload: UserUpdatePayload): Promise<ApiResponse> {
  return apiRequest(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getRolesApi(): Promise<ApiResponse<{ roles: RoleOption[] }>> {
  return apiRequest<{ roles: RoleOption[] }>("/api/roles", {
    method: "GET",
  });
}

export async function getEmployeesApi(): Promise<ApiResponse<{ employees: EmployeeOption[] }>> {
  return apiRequest<{ employees: EmployeeOption[] }>("/api/employees", {
    method: "GET",
  });
}

export async function requestSignupApi(payload: SignupRequestPayload): Promise<ApiResponse> {
  const res = await apiRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.success && res.error?.includes("404")) {
    return {
      success: false,
      error: "Public self-registration is disabled. Please contact your system administrator for access.",
    };
  }

  return res;
}

// Payroll API Callers
export async function getPayrollPeriodsApi(search?: string, year?: string, state?: string): Promise<ApiResponse<{ payroll_periods: PayrollPeriodRecord[] }>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (year && year !== "all") params.set("year", year);
  if (state && state !== "all") params.set("state", state);
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<{ payroll_periods: PayrollPeriodRecord[] }>(`/api/payroll-periods${queryString}`, {
    method: "GET",
  });
}

export async function getPayrunsApi(search?: string, year?: string, state?: string): Promise<ApiResponse<{ payruns: PayrunRecord[]; count: number }>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (year && year !== "all") params.set("year", year);
  if (state && state !== "all") params.set("state", state);
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<{ payruns: PayrunRecord[]; count: number }>(`/api/payruns${queryString}`, {
    method: "GET",
  });
}

export async function getPayrunByIdApi(id: number): Promise<ApiResponse<{ payrun: PayrunDetailRecord }>> {
  return apiRequest<{ payrun: PayrunDetailRecord }>(`/api/payruns/${id}`, {
    method: "GET",
  });
}

export async function getEligibleEmployeesApi(
  payroll_period_id?: number | null,
  salary_structure_id?: number | null,
  search?: string
): Promise<ApiResponse<{ employees: EligibleEmployeeRecord[]; count: number }>> {
  const params = new URLSearchParams();
  if (payroll_period_id) params.set("payroll_period_id", String(payroll_period_id));
  if (salary_structure_id) params.set("salary_structure_id", String(salary_structure_id));
  if (search) params.set("search", search);
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<{ employees: EligibleEmployeeRecord[]; count: number }>(`/api/payruns/eligible-employees${queryString}`, {
    method: "GET",
  });
}

export async function createPayrunApi(payload: {
  payroll_period_id: number;
  salary_structure_id?: number;
  name?: string;
  employee_ids: number[];
}): Promise<ApiResponse<{ payrun: PayrunRecord }>> {
  return apiRequest<{ payrun: PayrunRecord }>("/api/payruns", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function computePayrunApi(id: number): Promise<ApiResponse<{ message: string; state: string; total_net: string; warning_count: number }>> {
  return apiRequest(`/api/payruns/${id}/compute`, {
    method: "POST",
  });
}

export async function validatePayrunApi(id: number): Promise<ApiResponse<{ message: string; state: string }>> {
  return apiRequest(`/api/payruns/${id}/validate`, {
    method: "POST",
  });
}

export async function markPayrunPaidApi(id: number): Promise<ApiResponse<{ message: string; state: string }>> {
  return apiRequest(`/api/payruns/${id}/mark-paid`, {
    method: "POST",
  });
}

export async function sendPayslipsApi(id: number): Promise<ApiResponse<{ message: string; state: string; email_configured: boolean }>> {
  return apiRequest(`/api/payruns/${id}/send-payslips`, {
    method: "POST",
  });
}

// Payslip Module API Callers
export interface PayslipListItemRecord {
  id: string;
  payrun_id: number;
  payrun_name: string;
  payrun_reference: string;
  employee_id: number;
  employee_code: string;
  employee_name: string;
  employee_email: string | null;
  department_name: string;
  job_title: string;
  contract_id: number;
  payroll_period_id: number;
  period_name: string;
  period_date_from: string;
  period_date_to: string;
  salary_structure_name: string;
  reference: string;
  date_from: string;
  date_to: string;
  basic_salary: string;
  gross_salary: string;
  total_deductions: string;
  net_salary: string;
  total_working_days: string;
  days_worked: string;
  days_absent: string;
  leave_days_taken: string;
  overtime_hours: string;
  state: "draft" | "computed" | "validated" | "paid" | "sent" | "cancelled";
  has_warnings: boolean;
  warning_count: number;
  pdf_url?: string | null;
  pdf_generated_at?: string | null;
  email_sent: boolean;
  email_sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayslipDetailRecord extends PayslipListItemRecord {
  personal_email?: string | null;
  phone?: string | null;
  job_position?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc_code?: string;
  pan_number?: string;
  aadhaar_number?: string;
  uan_number?: string;
  esi_number?: string;
  contract_reference?: string | null;
  wage_type?: string;
  wage_amount?: string;
  salary_structure_id?: number;
  payrun_state?: string;
  lines: PayslipLineRecord[];
  warnings: PayrunWarningRecord[];
}

export async function getPayslipsApi(
  search?: string,
  payroll_period_id?: number | null,
  payrun_id?: number | null,
  state?: string,
  page: number = 1
): Promise<ApiResponse<{ payslips: PayslipListItemRecord[]; total: number; total_pages: number }>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (payroll_period_id) params.set("payroll_period_id", String(payroll_period_id));
  if (payrun_id) params.set("payrun_id", String(payrun_id));
  if (state && state !== "all") params.set("state", state);
  params.set("page", String(page));
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<{ payslips: PayslipListItemRecord[]; total: number; total_pages: number }>(`/api/payslips${queryString}`, {
    method: "GET",
  });
}

export async function getPayslipByIdApi(id: string | number): Promise<ApiResponse<{ payslip: PayslipDetailRecord }>> {
  return apiRequest<{ payslip: PayslipDetailRecord }>(`/api/payslips/${id}`, {
    method: "GET",
  });
}

export async function computeSinglePayslipApi(id: string | number): Promise<ApiResponse<{ payslip: PayslipDetailRecord }>> {
  return apiRequest<{ payslip: PayslipDetailRecord }>(`/api/payslips/${id}/compute`, {
    method: "POST",
  });
}

export async function markSinglePayslipPaidApi(id: string | number): Promise<ApiResponse<{ message: string; payslip: any }>> {
  return apiRequest<{ message: string; payslip: any }>(`/api/payslips/${id}/mark-paid`, {
    method: "POST",
  });
}

export function getPayslipPdfUrl(id: string | number): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/api/payslips/${id}/pdf`;
}

export interface EmployeeKanbanRecord {
  id: number;
  employeeCode: string;
  employee_code?: string;
  firstName: string;
  first_name?: string;
  lastName: string;
  last_name?: string;
  fullName: string;
  full_name?: string;
  initials: string;
  workEmail: string;
  work_email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  employmentType: string;
  employment_type?: string;
  kanbanState: string;
  kanban_state?: string;
  isActive: boolean;
  is_active?: boolean;
  status: string;
  department: string;
  departmentId?: number | null;
  department_id?: number | null;
  jobPosition: string;
  job_position?: string;
  jobPositionId?: number | null;
  companyName?: string | null;
  managerName?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
}

export async function getEmployeesKanbanApi(
  search?: string,
  kanban_state?: string,
  department_id?: number | null,
  page: number = 1
): Promise<ApiResponse<{ employees: EmployeeKanbanRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (kanban_state) params.set("kanban_state", kanban_state);
  if (department_id) params.set("department_id", String(department_id));
  params.set("page", String(page));
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<{ employees: EmployeeKanbanRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
    `/api/employees${queryString}`,
    { method: "GET" }
  );
}

export interface ContractRecord {
  id: number;
  reference: string;
  contract_reference?: string;
  contract_type?: string;
  employee_id: number;
  employee: {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    employee_code?: string;
    work_email?: string;
  };
  department_id?: number | null;
  department?: string;
  department_detail?: { id: number; name: string; code: string } | null;
  job_position_id?: number | null;
  job_position?: string;
  job_position_detail?: { id: number; title?: string; name?: string } | null;
  date_start: string;
  date_end?: string | null;
  wage_type?: string;
  wage_amount: string;
  wage_per_month?: string;
  currency_code?: string;
  working_schedule_id?: number | null;
  working_schedule?: string;
  working_schedule_detail?: { id: number; name: string; total_weekly_hours: string } | null;
  salary_structure_id?: number | null;
  salary_structure?: string;
  salary_structure_detail?: { id: number; name: string; code: string } | null;
  state: string;
  status: string;
  notes?: string | null;
  payslips_count?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface ContractFormOptions {
  employees: { id: number; name: string; employee_code: string; work_email?: string | null; department_id?: number | null }[];
  departments: { id: number; name: string; code: string }[];
  job_positions: { id: number; title: string }[];
  working_schedules: { id: number; name: string; total_weekly_hours: string }[];
  salary_structures: { id: number; name: string; code: string }[];
}

export interface ContractCreatePayload {
  employee_id: number;
  date_start: string;
  date_end?: string | null;
  wage_amount: number;
  wage_type?: string;
  contract_type?: string;
  department_id?: number | null;
  job_position_id?: number | null;
  working_schedule_id?: number | null;
  salary_structure_id?: number | null;
  state?: string;
  reference?: string;
  notes?: string;
}

export async function getContractsApi(
  search?: string,
  state?: string,
  page: number = 1
): Promise<ApiResponse<{ contracts: ContractRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (state && state !== "all") params.set("state", state);
  params.set("page", String(page));
  const queryString = params.toString() ? `?${params.toString()}` : "";

  return apiRequest<{ contracts: ContractRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
    `/api/contracts${queryString}`,
    { method: "GET" }
  );
}

export async function getContractByIdApi(
  id: string | number
): Promise<ApiResponse<{ contract: ContractRecord }>> {
  return apiRequest<{ contract: ContractRecord }>(`/api/contracts/${id}`, {
    method: "GET",
  });
}

export async function getContractOptionsApi(): Promise<ApiResponse<ContractFormOptions>> {
  return apiRequest<ContractFormOptions>("/api/contracts/options", {
    method: "GET",
  });
}

export async function createContractApi(
  payload: ContractCreatePayload
): Promise<ApiResponse<{ contract: ContractRecord }>> {
  return apiRequest<{ contract: ContractRecord }>("/api/contracts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateContractApi(
  id: string | number,
  payload: Partial<ContractCreatePayload>
): Promise<ApiResponse<{ contract: ContractRecord }>> {
  return apiRequest<{ contract: ContractRecord }>(`/api/contracts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteContractApi(
  id: string | number
): Promise<ApiResponse<{ message: string; data?: any }>> {
  return apiRequest<{ message: string; data?: any }>(`/api/contracts/${id}`, {
    method: "DELETE",
  });
}

/* ==========================================================================
   WORKING SCHEDULES API
   ========================================================================== */

export interface WorkingScheduleLine {
  id?: number;
  working_schedule_id?: number;
  day_of_week: number;
  day?: string;
  day_name?: string;
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  break?: number;
  is_working_day: boolean;
  net_hours?: number;
  hours?: number;
}

export interface WorkingScheduleRecord {
  id: number;
  company_id: number;
  company_name?: string;
  company?: { id: number; name: string };
  name: string;
  schedule_name?: string;
  timezone: string;
  total_weekly_hours: number;
  hours_per_week?: string;
  days_per_week?: number;
  is_default: boolean;
  is_active: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
  lines?: WorkingScheduleLine[];
  working_schedule_lines?: WorkingScheduleLine[];
}

export interface WorkingScheduleCreatePayload {
  name: string;
  company_id: number;
  timezone?: string;
  is_default?: boolean;
  is_active?: boolean;
  lines?: {
    day_of_week: number;
    day_name?: string;
    start_time: string;
    end_time: string;
    break_duration_minutes?: number;
    is_working_day?: boolean;
  }[];
}

export interface WorkingScheduleUpdatePayload {
  name?: string;
  company_id?: number;
  timezone?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export async function getWorkingSchedulesApi(params?: {
  search?: string;
  status?: string;
  company_id?: number;
}): Promise<ApiResponse<WorkingScheduleRecord[]>> {
  const qp = new URLSearchParams();
  if (params?.search) qp.set("search", params.search);
  if (params?.status) qp.set("status", params.status);
  if (params?.company_id) qp.set("company_id", String(params.company_id));
  const queryString = qp.toString() ? `?${qp.toString()}` : "";

  return apiRequest<WorkingScheduleRecord[]>(`/api/working-schedules${queryString}`, {
    method: "GET",
  });
}

export async function getWorkingScheduleByIdApi(
  id: string | number
): Promise<ApiResponse<WorkingScheduleRecord>> {
  return apiRequest<WorkingScheduleRecord>(`/api/working-schedules/${id}`, {
    method: "GET",
  });
}

export async function createWorkingScheduleApi(
  payload: WorkingScheduleCreatePayload
): Promise<ApiResponse<WorkingScheduleRecord>> {
  return apiRequest<WorkingScheduleRecord>("/api/working-schedules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateWorkingScheduleApi(
  id: string | number,
  payload: WorkingScheduleUpdatePayload
): Promise<ApiResponse<WorkingScheduleRecord>> {
  return apiRequest<WorkingScheduleRecord>(`/api/working-schedules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkingScheduleApi(
  id: string | number
): Promise<ApiResponse<{ message: string; deleted?: boolean; deactivated?: boolean }>> {
  return apiRequest<{ message: string; deleted?: boolean; deactivated?: boolean }>(
    `/api/working-schedules/${id}`,
    {
      method: "DELETE",
    }
  );
}

export async function addScheduleLineApi(
  scheduleId: string | number,
  linePayload: any
): Promise<ApiResponse<{ data: WorkingScheduleLine; total_weekly_hours: number }>> {
  return apiRequest<{ data: WorkingScheduleLine; total_weekly_hours: number }>(
    `/api/working-schedules/${scheduleId}/lines`,
    {
      method: "POST",
      body: JSON.stringify(linePayload),
    }
  );
}

export async function updateScheduleLineApi(
  scheduleId: string | number,
  lineId: string | number,
  linePayload: any
): Promise<ApiResponse<{ data: WorkingScheduleLine; total_weekly_hours: number }>> {
  return apiRequest<{ data: WorkingScheduleLine; total_weekly_hours: number }>(
    `/api/working-schedules/${scheduleId}/lines/${lineId}`,
    {
      method: "PATCH",
      body: JSON.stringify(linePayload),
    }
  );
}

export async function deleteScheduleLineApi(
  scheduleId: string | number,
  lineId: string | number
): Promise<ApiResponse<{ message: string; total_weekly_hours: number }>> {
  return apiRequest<{ message: string; total_weekly_hours: number }>(
    `/api/working-schedules/${scheduleId}/lines/${lineId}`,
    {
      method: "DELETE",
    }
  );
}

/* ==========================================================================
   ATTENDANCE API
   ========================================================================== */

export interface AttendanceRecord {
  id: string;
  employee_id: number;
  employee: {
    id: number;
    name: string;
    first_name?: string;
    last_name?: string;
    employee_code?: string;
    work_email?: string;
    avatar_url?: string | null;
  };
  employee_name: string;
  department: string;
  department_detail?: { id: number; name: string } | null;
  manager: string;
  manager_detail?: { id: number; name: string } | null;
  attendance_date: string;
  check_in: string | null;
  check_in_time: string;
  check_out: string | null;
  check_out_time: string;
  worked_hours: number | null;
  running_worked_hours: number;
  running_worked_hours_display: string;
  overtime_hours: number;
  break_hours: number;
  status: "present" | "absent" | "late" | "half_day" | "on_leave" | "holiday" | "missing_checkout" | string;
  status_display: string;
  is_late: boolean;
  late_minutes: number;
  is_early_leave: boolean;
  is_manually_corrected: boolean;
  corrected_by?: number | null;
  correction_reason?: string | null;
  notes?: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceWidgetData {
  authenticated_employee: {
    id: number;
    name: string;
    employee_code: string;
    work_email: string;
    department: string;
  };
  current_status: "checked_in" | "checked_out" | "not_checked_in";
  is_checked_in: boolean;
  check_in: string | null;
  check_in_time: string;
  check_out: string | null;
  check_out_time: string;
  today_worked_hours: number;
  running_worked_hours: number;
  running_worked_hours_display: string;
  status?: string;
  status_display?: string;
  today_record?: AttendanceRecord | null;
}

export async function getAttendanceListApi(params?: {
  search?: string;
  date?: string;
  employeeId?: string | number;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<AttendanceRecord[]> & { meta?: { total: number; page: number; limit: number; totalPages: number } }> {
  const qp = new URLSearchParams();
  if (params?.search) qp.set("search", params.search);
  if (params?.date) qp.set("date", params.date);
  if (params?.employeeId) qp.set("employeeId", String(params.employeeId));
  if (params?.status && params.status !== "all") qp.set("status", params.status);
  if (params?.page) qp.set("page", String(params.page));
  if (params?.limit) qp.set("limit", String(params.limit));

  const queryString = qp.toString() ? `?${qp.toString()}` : "";
  return apiRequest<AttendanceRecord[]>(`/api/attendance${queryString}`, {
    method: "GET",
  });
}

export async function getAttendanceByIdApi(
  id: string | number
): Promise<ApiResponse<AttendanceRecord>> {
  return apiRequest<AttendanceRecord>(`/api/attendance/${id}`, {
    method: "GET",
  });
}

export async function createAttendanceApi(
  payload: any
): Promise<ApiResponse<AttendanceRecord>> {
  return apiRequest<AttendanceRecord>("/api/attendance", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAttendanceApi(
  id: string | number,
  payload: any
): Promise<ApiResponse<AttendanceRecord>> {
  return apiRequest<AttendanceRecord>(`/api/attendance/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAttendanceApi(
  id: string | number
): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/attendance/${id}`, {
    method: "DELETE",
  });
}

export async function checkInApi(): Promise<ApiResponse<AttendanceRecord>> {
  return apiRequest<AttendanceRecord>("/api/attendance/check-in", {
    method: "POST",
  });
}

export async function checkOutApi(): Promise<ApiResponse<AttendanceRecord>> {
  return apiRequest<AttendanceRecord>("/api/attendance/check-out", {
    method: "POST",
  });
}

export async function getAttendanceMeApi(): Promise<ApiResponse<AttendanceWidgetData>> {
  return apiRequest<AttendanceWidgetData>("/api/attendance/me", {
    method: "GET",
  });
}

/* ==========================================================================
   TIME OFF API
   ========================================================================== */

export interface TimeOffTypeRecord {
  id: number;
  name: string;
  code: string;
  description?: string;
  requires_approval: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeOffAllocationRecord {
  id: number;
  employee_id: number;
  time_off_type_id: number;
  description?: string;
  allocated_days: number;
  used_days: number;
  remaining_days?: number;
  valid_from?: string;
  valid_until?: string;
  state: "draft" | "approved" | "refused";
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    name: string;
    employee_code?: string;
  };
  time_off_type?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface TimeOffRequestRecord {
  id: number;
  employee_id: number;
  time_off_type_id: number;
  date_from: string;
  date_to: string;
  days_requested: number;
  description?: string;
  state: "draft" | "approved" | "refused";
  manager_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    name: string;
    employee_code?: string;
  };
  time_off_type?: {
    id: number;
    name: string;
    code: string;
  };
  manager?: {
    id: number;
    name: string;
  };
}

// -- Time Off Types --

export async function getTimeOffTypesApi(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<TimeOffTypeRecord[]> & { meta?: { total: number; page: number; limit: number; totalPages: number } }> {
  const qp = new URLSearchParams();
  if (params?.search) qp.set("search", params.search);
  if (params?.status && params.status !== "all") qp.set("status", params.status);
  if (params?.page) qp.set("page", String(params.page));
  if (params?.limit) qp.set("limit", String(params.limit));

  const queryString = qp.toString() ? `?${qp.toString()}` : "";
  return apiRequest<TimeOffTypeRecord[]>(`/api/time-off/types${queryString}`, {
    method: "GET",
  });
}

export async function getTimeOffTypeByIdApi(id: string | number): Promise<ApiResponse<TimeOffTypeRecord>> {
  return apiRequest<TimeOffTypeRecord>(`/api/time-off/types/${id}`, {
    method: "GET",
  });
}

export async function createTimeOffTypeApi(payload: any): Promise<ApiResponse<TimeOffTypeRecord>> {
  return apiRequest<TimeOffTypeRecord>("/api/time-off/types", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTimeOffTypeApi(id: string | number, payload: any): Promise<ApiResponse<TimeOffTypeRecord>> {
  return apiRequest<TimeOffTypeRecord>(`/api/time-off/types/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTimeOffTypeApi(id: string | number): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/time-off/types/${id}`, {
    method: "DELETE",
  });
}

// -- Time Off Allocations --

export async function getTimeOffAllocationsApi(params?: {
  search?: string;
  employeeId?: string | number;
  typeId?: string | number;
  state?: string;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<TimeOffAllocationRecord[]> & { meta?: { total: number; page: number; limit: number; totalPages: number } }> {
  const qp = new URLSearchParams();
  if (params?.search) qp.set("search", params.search);
  if (params?.employeeId) qp.set("employeeId", String(params.employeeId));
  if (params?.typeId) qp.set("typeId", String(params.typeId));
  if (params?.state && params.state !== "all") qp.set("state", params.state);
  if (params?.page) qp.set("page", String(params.page));
  if (params?.limit) qp.set("limit", String(params.limit));

  const queryString = qp.toString() ? `?${qp.toString()}` : "";
  return apiRequest<TimeOffAllocationRecord[]>(`/api/time-off/allocations${queryString}`, {
    method: "GET",
  });
}

export async function getTimeOffAllocationByIdApi(id: string | number): Promise<ApiResponse<TimeOffAllocationRecord>> {
  return apiRequest<TimeOffAllocationRecord>(`/api/time-off/allocations/${id}`, {
    method: "GET",
  });
}

export async function createTimeOffAllocationApi(payload: any): Promise<ApiResponse<TimeOffAllocationRecord>> {
  return apiRequest<TimeOffAllocationRecord>("/api/time-off/allocations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTimeOffAllocationApi(id: string | number, payload: any): Promise<ApiResponse<TimeOffAllocationRecord>> {
  return apiRequest<TimeOffAllocationRecord>(`/api/time-off/allocations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTimeOffAllocationApi(id: string | number): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/time-off/allocations/${id}`, {
    method: "DELETE",
  });
}

export async function approveTimeOffAllocationApi(id: string | number): Promise<ApiResponse<TimeOffAllocationRecord>> {
  return apiRequest<TimeOffAllocationRecord>(`/api/time-off/allocations/${id}/approve`, {
    method: "POST",
  });
}

// -- Time Off Requests --

export async function getTimeOffRequestsApi(params?: {
  search?: string;
  employeeId?: string | number;
  typeId?: string | number;
  state?: string;
  myTeam?: boolean;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<TimeOffRequestRecord[]> & { meta?: { total: number; page: number; limit: number; totalPages: number } }> {
  const qp = new URLSearchParams();
  if (params?.search) qp.set("search", params.search);
  if (params?.employeeId) qp.set("employeeId", String(params.employeeId));
  if (params?.typeId) qp.set("typeId", String(params.typeId));
  if (params?.state && params.state !== "all") qp.set("state", params.state);
  if (params?.myTeam) qp.set("myTeam", "true");
  if (params?.page) qp.set("page", String(params.page));
  if (params?.limit) qp.set("limit", String(params.limit));

  const queryString = qp.toString() ? `?${qp.toString()}` : "";
  return apiRequest<TimeOffRequestRecord[]>(`/api/time-off/requests${queryString}`, {
    method: "GET",
  });
}

export async function getTimeOffRequestByIdApi(id: string | number): Promise<ApiResponse<TimeOffRequestRecord>> {
  return apiRequest<TimeOffRequestRecord>(`/api/time-off/requests/${id}`, {
    method: "GET",
  });
}

export async function createTimeOffRequestApi(payload: any): Promise<ApiResponse<TimeOffRequestRecord>> {
  return apiRequest<TimeOffRequestRecord>("/api/time-off/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTimeOffRequestApi(id: string | number, payload: any): Promise<ApiResponse<TimeOffRequestRecord>> {
  return apiRequest<TimeOffRequestRecord>(`/api/time-off/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteTimeOffRequestApi(id: string | number): Promise<ApiResponse<{ message: string }>> {
  return apiRequest<{ message: string }>(`/api/time-off/requests/${id}`, {
    method: "DELETE",
  });
}

export async function approveTimeOffRequestApi(id: string | number): Promise<ApiResponse<TimeOffRequestRecord>> {
  return apiRequest<TimeOffRequestRecord>(`/api/time-off/requests/${id}/approve`, {
    method: "POST",
  });
}

export async function refuseTimeOffRequestApi(id: string | number): Promise<ApiResponse<TimeOffRequestRecord>> {
  return apiRequest<TimeOffRequestRecord>(`/api/time-off/requests/${id}/refuse`, {
    method: "POST",
  });
}

// ==========================================
// PAYROLL DASHBOARD API
// ==========================================

export interface PayrollDashboardData {
  filters: {
    periodOptions: { id: number; name: string; dateFrom: string; dateTo: string; state: string }[];
    departmentOptions: { id: number | string; name: string; code?: string }[];
    employeeTypeOptions: { id: string; name: string }[];
    companyOptions: { id: number; name: string; currency?: string }[];
    activeFilters: {
      periodId: number | null;
      periodName: string;
      departmentId: number | string;
      employeeType: string;
      companyId: number | null;
    };
  };
  kpis: {
    totalNetSalaryPaid: number;
    formattedNetSalaryPaid: string;
    payslipsGenerated: {
      total: number;
      paid: number;
      pending: number;
    };
    averageSalary: number;
    formattedAverageSalary: string;
    employeeCountForAverage: number;
    approvedTimeOffDays: number;
    pendingTimeOffCount: number;
    attendanceHealth: {
      percentage: number;
      presentRecords: number;
      lateRecords: number;
      absentRecords: number;
      overtimeHours: number;
      missingCheckouts: number;
      manualCorrections: number;
      totalRecords: number;
    };
  };
  salaryByDepartment: {
    departmentId: number;
    departmentName: string;
    salaryCost: number;
    employeeCount: number;
  }[];
  monthlyNetSalaryTrend: {
    month: string;
    netSalary: number;
    payrollPeriodId: number;
  }[];
  payslipStatus: {
    total: number;
    paid: number;
    pending: number;
    draft: number;
    computed: number;
    validated: number;
    cancelled: number;
    withWarnings: number;
  };
  payrollAlerts: {
    id: string;
    type: string;
    severity: "warning" | "error" | "info";
    message: string;
    source: string;
  }[];
  attendanceOverview: {
    presentCount: number;
    lateCount: number;
    absentCount: number;
    overtimeCount: number;
    missingCheckouts: number;
    attendancePercentage: number;
  };
  timeOffOverview: {
    typeId: number;
    type: string;
    leaveUnit: string;
    approvedDays: number;
    pendingCount: number;
    remainingBalance: number;
  }[];
  departmentOverview: {
    departmentId: number;
    departmentName: string;
    headcount: number;
    monthlySalary: number;
  }[];
}

export async function getPayrollDashboardApi(params?: {
  period?: string | number;
  departmentId?: string | number;
  employeeType?: string;
  companyId?: string | number;
}): Promise<ApiResponse<PayrollDashboardData>> {
  const qp = new URLSearchParams();
  if (params?.period) qp.set("period", String(params.period));
  if (params?.departmentId && params.departmentId !== "all") qp.set("departmentId", String(params.departmentId));
  if (params?.employeeType && params.employeeType !== "all") qp.set("employeeType", params.employeeType);
  if (params?.companyId) qp.set("companyId", String(params.companyId));

  const queryString = qp.toString() ? `?${qp.toString()}` : "";
  return apiRequest<PayrollDashboardData>(`/api/payroll/dashboard${queryString}`, {
    method: "GET",
  });
}

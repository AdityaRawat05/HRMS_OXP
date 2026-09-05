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



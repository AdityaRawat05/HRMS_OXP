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
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";
};

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

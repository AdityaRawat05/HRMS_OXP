import axios from 'axios';
import { ApiResponse, AuthResponseData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if stored
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('peoplepay360_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Clear token on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected calls, clear stale auth data
      if (!error.config.url?.includes('/auth/login')) {
        localStorage.removeItem('peoplepay360_token');
        localStorage.removeItem('peoplepay360_user');
      }
    }
    return Promise.reject(error);
  }
);

export const fetchHealthStatus = async () => {
  const response = await apiClient.get<ApiResponse>('/health');
  return response.data;
};

export const loginApi = async (email: string, password: string): Promise<AuthResponseData> => {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', {
    email,
    password,
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Login failed');
  }

  return response.data.data;
};

export const getMeApi = async () => {
  const response = await apiClient.get<ApiResponse<{ user: any }>>('/auth/me');
  return response.data.data?.user;
};

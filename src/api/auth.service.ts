import { AuthResponse, AuthUser } from './types';
import { BASE_URL, createHeaders, handleResponse } from './http';

export const authApi = {
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthResponse>(response);
  },

  // 管理员创建用户（需要携带 Token）
  createUser: async (credentials: { username: string; password: string; role?: string; teamId?: string }): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthResponse>(response);
  },

  // 获取当前登录用户信息
  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<AuthUser>(response);
  },
};

export const userApi = {
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/auth/users`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<any[]>(response);
  },

  updateRole: async (id: string, role: string, teamId: string | null): Promise<any> => {
    const response = await fetch(`${BASE_URL}/auth/users/${id}/role`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ role, teamId }),
    });
    return handleResponse<any>(response);
  },

  delete: async (id: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/auth/users/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<any>(response);
  },

  resetPassword: async (id: string, password: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/auth/users/${id}/reset-password`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ password }),
    });
    return handleResponse<any>(response);
  },
};

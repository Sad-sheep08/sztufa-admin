import { ApiResponse } from './types';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

const BASE_URL = 'https://sztufa-server.vercel.app/api/v1';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || '登录失败');
    }
    
    return response.json();
  },

  register: async (userData: RegisterRequest): Promise<ApiResponse<{ user: unknown }>> => {
    const { confirmPassword, ...registerData } = userData;
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || '注册失败');
    }
    
    return response.json();
  },
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
};

export const setTokenExpiry = (expiryTime: number): void => {
  localStorage.setItem('tokenExpiry', expiryTime.toString());
};

export const getTokenExpiry = (): number | null => {
  const expiry = localStorage.getItem('tokenExpiry');
  return expiry ? parseInt(expiry, 10) : null;
};

export const removeTokenExpiry = (): void => {
  localStorage.removeItem('tokenExpiry');
};

export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() > expiry;
};

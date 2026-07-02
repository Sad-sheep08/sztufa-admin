import { AuthResponse } from './types';

const BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3001/api/v1' : 'https://api.sztufa.xyz/api/v1';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role?: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorMessage = Array.isArray(data.message) 
        ? data.message.join(', ') 
        : (data.message || '登录失败');
      throw new Error(errorMessage);
    }
    
    return response.json();
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorMessage = Array.isArray(data.message) 
        ? data.message.join(', ') 
        : (data.message || '注册失败');
      throw new Error(errorMessage);
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
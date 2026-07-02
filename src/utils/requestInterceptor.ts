import { getAuthToken, isTokenExpired } from '../api/auth';

const BASE_URL = !window.location.hostname.endsWith('sztufa.xyz') ? 'http://localhost:3001/api/v1' : 'https://api.sztufa.xyz/api/v1';

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
}

export const requestInterceptor = async (url: string, config: RequestConfig = {}): Promise<RequestInit> => {
  const { skipAuth = false, ...rest } = config;
  
  const headers = new Headers();
  
  if (!skipAuth && config.headers !== undefined) {
    if (config.headers instanceof Headers) {
      config.headers.forEach((value, key) => {
        headers.set(key, value);
      });
    } else if (typeof config.headers === 'object' && config.headers !== null) {
      Object.entries(config.headers as Record<string, string>).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }
  }

  if (!headers.has('Content-Type') && !(config.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!skipAuth && !headers.has('Authorization')) {
    const token = getAuthToken();
    if (token && !isTokenExpired()) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return {
    ...rest,
    headers,
  };
};

export const authRequest = async <T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<{ data: T; response: Response }> => {
  const isFormData = config.body instanceof FormData;
  
  const headers: HeadersInit = {};
  if (!isFormData) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }
  
  if (!config.skipAuth) {
    const token = getAuthToken();
    if (token && !isTokenExpired()) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...config,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.message || `请求失败 (${response.status})`;
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('user');
      window.location.href = '/login?expired=true';
    }
    
    throw new Error(errorMessage);
  }

  return { data: data as T, response };
};

export const get = <T>(endpoint: string, config?: RequestConfig): Promise<{ data: T; response: Response }> => {
  return authRequest<T>(endpoint, { ...config, method: 'GET' });
};

export const post = <T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<{ data: T; response: Response }> => {
  return authRequest<T>(endpoint, {
    ...config,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
};

export const put = <T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<{ data: T; response: Response }> => {
  return authRequest<T>(endpoint, {
    ...config,
    method: 'PUT',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
};

export const patch = <T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<{ data: T; response: Response }> => {
  return authRequest<T>(endpoint, {
    ...config,
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body),
  });
};

export const del = <T>(endpoint: string, config?: RequestConfig): Promise<{ data: T; response: Response }> => {
  return authRequest<T>(endpoint, { ...config, method: 'DELETE' });
};

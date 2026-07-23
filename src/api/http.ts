declare const ADMIN_API_BASE_URL: string;

const configuredApiBaseUrl =
  typeof ADMIN_API_BASE_URL !== 'undefined' ? ADMIN_API_BASE_URL : '';

export const BASE_URL = (
  configuredApiBaseUrl ||
  (typeof window !== 'undefined' &&
  !window.location.hostname.endsWith('sztufa.xyz')
    ? '/api/v1'
    : 'https://api.sztufa.xyz/api/v1')
).replace(/\/$/, '');

// P1-3: 统一的 Token 管理函数
export const getAuthToken = (): string | null => {
  // P1-1: 优先从 localStorage 读取，然后从 sessionStorage
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
};

export const getTokenExpiry = (): number | null => {
  // P1-1: 优先从 localStorage 读取，然后从 sessionStorage
  const expiry = localStorage.getItem('tokenExpiry') || sessionStorage.getItem('tokenExpiry');
  return expiry ? parseInt(expiry, 10) : null;
};

export const setTokenExpiry = (expiry: number): void => {
  localStorage.setItem('tokenExpiry', expiry.toString());
};

export const removeTokenExpiry = (): void => {
  localStorage.removeItem('tokenExpiry');
  sessionStorage.removeItem('tokenExpiry');
};

export const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() > expiry;
};

export const handleAuthError = (response: Response): void => {
  if (response.status === 401) {
    // P1-3: 清理所有可能的存储位置
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('tokenExpiry');
    window.location.href = '/login?expired=true';
  }
};

export const createHeaders = (multipart = false): Headers => {
  const headers = new Headers();
  const token = getAuthToken();
  
  if (token && !isTokenExpired()) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!multipart) {
    headers.set('Content-Type', 'application/json');
  }
  
  return headers;
};

export const handleResponse = async <T>(response: Response): Promise<T> => {
  const isOk = response.ok;
  const status = response.status;

  if (status === 401) {
    handleAuthError(response);
  }
  
  let responseText = '';
  try {
    responseText = await response.text();
  } catch (textErr) {
    throw new Error(`无法读取服务器响应: ${status}`);
  }

  let data: any = null;
  let isJson = false;
  try {
    data = JSON.parse(responseText);
    isJson = true;
  } catch (jsonErr) {
    // 不是 JSON 响应（可能是 HTML，例如 502 Bad Gateway）
  }

  if (!isOk) {
    if (isJson && data) {
      const errorMessage = Array.isArray(data.message) 
        ? data.message.join(', ') 
        : (data.message || (status === 401 ? '登录状态失效，请重新登录' : '请求失败'));
      throw new Error(errorMessage);
    } else {
      if (status === 502 || status === 504) {
        throw new Error('服务器网关或代理超时异常 (502/504)，请稍后再试');
      }
      if (status === 500) {
        throw new Error('服务器内部逻辑发生错误 (500)，请联系系统管理员');
      }
      if (status === 403) {
        throw new Error('您无权执行此操作 (403)');
      }
      if (status === 404) {
        throw new Error('请求的接口资源未找到 (404)');
      }
      throw new Error(`服务器响应失败，状态码: ${status}`);
    }
  }

  if (!isJson) {
    throw new Error('服务器返回的响应格式不正确，期望 JSON 数据');
  }

  return data as T;
};

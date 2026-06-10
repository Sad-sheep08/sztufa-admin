import { ApiResponse, ErrorResponse, TeamDTO, MatchDTO, TeamListResponse, MatchListResponse } from './types';

const BASE_URL = 'https://sztufa-server.vercel.app/api/v1';

const getAuthToken = (): string | null => {
  return localStorage.getItem('token') || null;
};

const createHeaders = (multipart = false): Headers => {
  const headers = new Headers();
  const token = getAuthToken();
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!multipart) {
    headers.set('Content-Type', 'application/json');
  }
  
  return headers;
};

const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || (response.status === 401 ? 'Unauthorized' : '请求失败');
      throw new Error(errorMessage);
    }
    
    return data as ApiResponse<T>;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络请求异常');
  }
};

export const teamApi = {
  create: async (teamData: TeamDTO): Promise<ApiResponse<TeamDTO>> => {
    const response = await fetch(`${BASE_URL}/teams`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(teamData),
    });
    return handleResponse<TeamDTO>(response);
  },

  getAll: async (page = 1, limit = 10): Promise<ApiResponse<TeamListResponse>> => {
    const response = await fetch(`${BASE_URL}/teams?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<TeamListResponse>(response);
  },

  getById: async (id: string): Promise<ApiResponse<TeamDTO>> => {
    const response = await fetch(`${BASE_URL}/teams/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<TeamDTO>(response);
  },

  update: async (id: string, teamData: Partial<TeamDTO>): Promise<ApiResponse<TeamDTO>> => {
    const response = await fetch(`${BASE_URL}/teams/${id}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(teamData),
    });
    return handleResponse<TeamDTO>(response);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${BASE_URL}/teams/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<void>(response);
  },
};

export const matchApi = {
  create: async (matchData: MatchDTO): Promise<ApiResponse<MatchDTO>> => {
    const response = await fetch(`${BASE_URL}/matches`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(matchData),
    });
    return handleResponse<MatchDTO>(response);
  },

  getAll: async (page = 1, limit = 10): Promise<ApiResponse<MatchListResponse>> => {
    const response = await fetch(`${BASE_URL}/matches?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<MatchListResponse>(response);
  },

  getById: async (id: string): Promise<ApiResponse<MatchDTO>> => {
    const response = await fetch(`${BASE_URL}/matches/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<MatchDTO>(response);
  },

  update: async (id: string, matchData: Partial<MatchDTO>): Promise<ApiResponse<MatchDTO>> => {
    const response = await fetch(`${BASE_URL}/matches/${id}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(matchData),
    });
    return handleResponse<MatchDTO>(response);
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await fetch(`${BASE_URL}/matches/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<void>(response);
  },
};

export const authApi = {
  login: async (username: string, password: string): Promise<ApiResponse<{ token: string; user: unknown }>> => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<{ token: string; user: unknown }>(response);
  },

  register: async (username: string, password: string): Promise<ApiResponse<{ user: unknown }>> => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<{ user: unknown }>(response);
  },
};

export const validateResponse = (response: ApiResponse | ErrorResponse): response is ApiResponse => {
  return response.success === true;
};
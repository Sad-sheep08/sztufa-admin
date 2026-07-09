import { ApiResponse, ErrorResponse, TeamDTO, MatchDTO, PlayerDTO, TeamListResponse, MatchListResponse, PlayerListResponse, ImportResult, AuthResponse, AuditLogDTO, BackupDTO } from './types';

const BASE_URL = !window.location.hostname.endsWith('sztufa.xyz') ? 'http://localhost:3001/api/v1' : 'https://api.sztufa.xyz/api/v1';

const getAuthToken = (): string | null => {
  return localStorage.getItem('token') || null;
};

const getTokenExpiry = (): number | null => {
  const expiry = localStorage.getItem('tokenExpiry');
  return expiry ? parseInt(expiry, 10) : null;
};

const isTokenExpired = (): boolean => {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  return Date.now() > expiry;
};

const handleAuthError = (response: Response): void => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    window.location.href = '/login?expired=true';
  }
};

const createHeaders = (multipart = false): Headers => {
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

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 401) {
    handleAuthError(response);
  }
  
  try {
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = Array.isArray(data.message) 
        ? data.message.join(', ') 
        : (data.message || (response.status === 401 ? 'Unauthorized' : '请求失败'));
      throw new Error(errorMessage);
    }
    
    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络请求异常');
  }
};

export const teamApi = {
  create: async (teamData: TeamDTO): Promise<TeamDTO> => {
    const response = await fetch(`${BASE_URL}/teams`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(teamData),
    });
    return handleResponse<TeamDTO>(response);
  },

  getAll: async (page = 1, limit = 10): Promise<TeamListResponse> => {
    const response = await fetch(`${BASE_URL}/teams?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<TeamListResponse>(response);
  },

  search: async (name: string): Promise<TeamDTO[]> => {
    const response = await fetch(`${BASE_URL}/teams/search?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<TeamDTO[]>(response);
  },

  getById: async (id: string): Promise<TeamDTO> => {
    const response = await fetch(`${BASE_URL}/teams/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<TeamDTO>(response);
  },

  update: async (id: string, teamData: Partial<TeamDTO>): Promise<TeamDTO> => {
    const response = await fetch(`${BASE_URL}/teams/${id}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(teamData),
    });
    return handleResponse<TeamDTO>(response);
  },

  delete: async (id: string): Promise<TeamDTO> => {
    const response = await fetch(`${BASE_URL}/teams/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<TeamDTO>(response);
  },
};

export const playerApi = {
  create: async (playerData: PlayerDTO): Promise<PlayerDTO> => {
    const response = await fetch(`${BASE_URL}/players`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(playerData),
    });
    return handleResponse<PlayerDTO>(response);
  },

  getAll: async (page = 1, limit = 10, teamId?: string): Promise<PlayerListResponse> => {
    let url = `${BASE_URL}/players?page=${page}&limit=${limit}`;
    if (teamId) {
      url += `&teamId=${teamId}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<PlayerListResponse>(response);
  },

  search: async (name: string): Promise<PlayerDTO[]> => {
    const response = await fetch(`${BASE_URL}/players/search?name=${encodeURIComponent(name)}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<PlayerDTO[]>(response);
  },

  getById: async (id: string): Promise<PlayerDTO> => {
    const response = await fetch(`${BASE_URL}/players/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<PlayerDTO>(response);
  },

  update: async (id: string, playerData: Partial<PlayerDTO>): Promise<PlayerDTO> => {
    const response = await fetch(`${BASE_URL}/players/${id}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(playerData),
    });
    return handleResponse<PlayerDTO>(response);
  },

  delete: async (id: string): Promise<PlayerDTO> => {
    const response = await fetch(`${BASE_URL}/players/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<PlayerDTO>(response);
  },
};

export const matchApi = {
  create: async (matchData: MatchDTO): Promise<MatchDTO> => {
    const response = await fetch(`${BASE_URL}/matches`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(matchData),
    });
    return handleResponse<MatchDTO>(response);
  },

  getAll: async (page = 1, limit = 10, teamId?: string): Promise<MatchListResponse> => {
    let url = `${BASE_URL}/matches?page=${page}&limit=${limit}`;
    if (teamId) {
      url += `&teamId=${teamId}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<MatchListResponse>(response);
  },

  getById: async (id: string): Promise<MatchDTO> => {
    const response = await fetch(`${BASE_URL}/matches/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<MatchDTO>(response);
  },

  update: async (id: string, matchData: Partial<MatchDTO>): Promise<MatchDTO> => {
    const response = await fetch(`${BASE_URL}/matches/${id}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(matchData),
    });
    return handleResponse<MatchDTO>(response);
  },

  delete: async (id: string): Promise<MatchDTO> => {
    const response = await fetch(`${BASE_URL}/matches/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<MatchDTO>(response);
  },
};

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password }),
    });
    return handleResponse<AuthResponse>(response);
  },

  register: async (username: string, password: string, role?: string): Promise<AuthResponse> => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password, role }),
    });
    return handleResponse<AuthResponse>(response);
  },
};

export const importApi = {
  importFromJson: async (filePath: string): Promise<ApiResponse<{ result: ImportResult }>> => {
    const response = await fetch(`${BASE_URL}/import/json`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ filePath }),
    });
    return handleResponse<ApiResponse<{ result: ImportResult }>>(response);
  },
};

export const uploadApi = {
  upload: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers = new Headers();
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse<ApiResponse<{ url: string }>>(response);
  },
};

export const auditLogApi = {
  getAll: async (page = 1, limit = 20): Promise<{ data: AuditLogDTO[]; total: number; page: number; limit: number }> => {
    const response = await fetch(`${BASE_URL}/audit-logs?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<{ data: AuditLogDTO[]; total: number; page: number; limit: number }>(response);
  },
};

export const backupApi = {
  create: async (): Promise<{ success: boolean; downloadUrl: string }> => {
    const response = await fetch(`${BASE_URL}/backups/create`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; downloadUrl: string }>(response);
  },
  list: async (): Promise<{ success: boolean; data: BackupDTO[] }> => {
    const response = await fetch(`${BASE_URL}/backups/list`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<{ success: boolean; data: BackupDTO[] }>(response);
  },
  restore: async (key: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${BASE_URL}/backups/restore`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ key }),
    });
    return handleResponse<{ success: boolean; message: string }>(response);
  },
};

export const seasonApi = {
  getAll: async (): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/seasons`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<any[]>(response);
  },
  getActive: async (): Promise<any> => {
    const response = await fetch(`${BASE_URL}/seasons/active`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<any>(response);
  },
  archive: async (name: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/seasons/archive`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse<any>(response);
  },
};

export const validateResponse = (response: ApiResponse | ErrorResponse): response is ApiResponse => {
  return 'data' in response && 'message' in response;
};
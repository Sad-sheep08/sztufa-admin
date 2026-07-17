import { ApiResponse, ErrorResponse, TeamDTO, MatchDTO, PlayerDTO, TeamListResponse, MatchListResponse, PlayerListResponse, ImportResult, AuthResponse, AuditLogDTO, BackupDTO } from './types';

const BASE_URL = typeof window !== 'undefined' && !window.location.hostname.endsWith('sztufa.xyz') ? '/api/v1' : 'https://api.sztufa.xyz/api/v1';

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

export const teamApi = {
  create: async (teamData: TeamDTO): Promise<TeamDTO> => {
    const response = await fetch(`${BASE_URL}/teams`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(teamData),
    });
    return handleResponse<TeamDTO>(response);
  },

  getAll: async (page = 1, limit = 10, seasonId?: string, gender?: string): Promise<TeamListResponse> => {
    let url = `${BASE_URL}/teams?page=${page}&limit=${limit}`;
    if (seasonId) {
      url += `&seasonId=${seasonId}`;
    }
    if (gender) {
      url += `&gender=${gender}`;
    }
    const response = await fetch(url, {
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

  getPlayers: async (id: string, seasonId?: string): Promise<PlayerDTO[]> => {
    let url = `${BASE_URL}/teams/${id}/players`;
    if (seasonId) {
      url += `?seasonId=${seasonId}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<PlayerDTO[]>(response);
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

  getAll: async (
    page = 1,
    limit = 100,
    teamId?: string,
    seasonId?: string,
    stage?: string,
    groupName?: string,
    knockoutRound?: string
  ): Promise<MatchListResponse> => {
    let url = `${BASE_URL}/matches?page=${page}&limit=${limit}`;
    if (teamId) {
      url += `&teamId=${teamId}`;
    }
    if (seasonId) {
      url += `&seasonId=${seasonId}`;
    }
    if (stage) {
      url += `&stage=${stage}`;
    }
    if (groupName) {
      url += `&groupName=${groupName}`;
    }
    if (knockoutRound) {
      url += `&knockoutRound=${knockoutRound}`;
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

  register: async (credentials: { username: string; password: string; role?: string; teamId?: string }): Promise<AuthResponse> => {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify(credentials),
    });
    return handleResponse<AuthResponse>(response);
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
  getAll: async (page = 1, limit = 20, username = '', action = ''): Promise<{ data: AuditLogDTO[]; total: number; page: number; limit: number }> => {
    let url = `${BASE_URL}/audit-logs?page=${page}&limit=${limit}`;
    if (username) url += `&username=${encodeURIComponent(username)}`;
    if (action) url += `&action=${encodeURIComponent(action)}`;
    const response = await fetch(url, {
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
  archive: async (name: string, type: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/seasons/archive`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ name, type }),
    });
    return handleResponse<any>(response);
  },
  create: async (name: string, type: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/seasons`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ name, type }),
    });
    return handleResponse<any>(response);
  },
  updateStatus: async (id: string, status: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}/status`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<any>(response);
  },
  getGroups: async (id: string): Promise<any[]> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}/groups`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<any[]>(response);
  },
  updateGroups: async (id: string, groups: { teamId: string; groupName: string }[]): Promise<any> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}/groups`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ groups }),
    });
    return handleResponse<any>(response);
  },
  generateKnockout: async (id: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}/generate-knockout`, {
      method: 'POST',
      headers: createHeaders(),
    });
    return handleResponse<any>(response);
  },
};

export interface NewsDTO {
  id?: string;
  title: string;
  category: string;
  description: string;
  coverImage?: string | null;
  wechatUrl: string;
  date: string;
}

export const newsApi = {
  create: async (newsData: NewsDTO): Promise<NewsDTO> => {
    const response = await fetch(`${BASE_URL}/news`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(newsData),
    });
    return handleResponse<NewsDTO>(response);
  },

  getAll: async (page = 1, limit = 10, category = 'all'): Promise<{ data: NewsDTO[]; total: number; page: number; limit: number }> => {
    let url = `${BASE_URL}/news?page=${page}&limit=${limit}`;
    if (category && category !== 'all') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<{ data: NewsDTO[]; total: number; page: number; limit: number }>(response);
  },

  getById: async (id: string): Promise<NewsDTO> => {
    const response = await fetch(`${BASE_URL}/news/${id}`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<NewsDTO>(response);
  },

  update: async (id: string, newsData: Partial<NewsDTO>): Promise<NewsDTO> => {
    const response = await fetch(`${BASE_URL}/news/${id}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(newsData),
    });
    return handleResponse<NewsDTO>(response);
  },

  delete: async (id: string): Promise<NewsDTO> => {
    const response = await fetch(`${BASE_URL}/news/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse<NewsDTO>(response);
  },
};

export const validateResponse = (response: ApiResponse | ErrorResponse): response is ApiResponse => {
  return 'data' in response && 'message' in response;
};
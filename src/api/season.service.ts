import { BASE_URL, createHeaders, handleResponse } from './http';
import { SeasonDTO } from './types';

export const seasonApi = {
  getAll: async (): Promise<SeasonDTO[]> => {
    const response = await fetch(`${BASE_URL}/seasons`, {
      method: 'GET',
      headers: createHeaders(),
    });
    return handleResponse<SeasonDTO[]>(response);
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
  rename: async (id: string, name: string): Promise<SeasonDTO> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify({ name }),
    });
    return handleResponse<SeasonDTO>(response);
  },
  delete: async (id: string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/seasons/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
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

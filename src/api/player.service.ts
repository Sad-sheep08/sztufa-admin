import { PlayerDTO, PlayerListResponse } from './types';
import { BASE_URL, createHeaders, handleResponse } from './http';

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

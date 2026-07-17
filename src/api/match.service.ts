import { MatchDTO, MatchListResponse } from './types';
import { BASE_URL, createHeaders, handleResponse } from './http';

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

import { CreateTeamWithPlayersDTO, TeamDTO, TeamListResponse, PlayerDTO } from './types';
import { BASE_URL, createHeaders, handleResponse } from './http';

type TeamPlayerUpdatePayload = Omit<PlayerDTO, 'teamId'> & { id?: string };

export const teamApi = {
  createWithPlayers: async (teamData: CreateTeamWithPlayersDTO): Promise<TeamDTO> => {
    const response = await fetch(`${BASE_URL}/teams/with-players`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(teamData),
    });
    return handleResponse<TeamDTO>(response);
  },

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

  updateWithPlayers: async (
    id: string,
    data: {
      teamName?: string;
      teamDoctor?: string;
      headCoach?: string;
      teamLeader?: string;
      coachPhone?: string;
      leaderPhone?: string;
      homeJerseyColor?: string;
      awayJerseyColor?: string;
      teamLogo?: string | null;
      homeJersey?: string | null;
      awayJersey?: string | null;
      gender?: string;
      players?: TeamPlayerUpdatePayload[];
      deletePlayerIds?: string[];
    }
  ): Promise<TeamDTO> => {
    const response = await fetch(`${BASE_URL}/teams/${id}/with-players`, {
      method: 'PATCH',
      headers: createHeaders(),
      body: JSON.stringify(data),
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

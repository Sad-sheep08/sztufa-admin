import { teamApi, matchApi, playerApi, authApi, importApi, validateResponse } from './service';
import { ApiResponse, TeamDTO, MatchDTO, PlayerDTO } from './types';

type MockFetchResponse = {
  ok: boolean;
  status?: number;
  json?: jest.Mock;
  text?: jest.Mock;
};

const normalizeMockResponse = async (response: MockFetchResponse): Promise<Response> => {
  const status = response.status ?? (response.ok ? 200 : 400);
  const body = response.json ? await response.json() : null;

  return {
    ...response,
    status,
    text: response.text ?? jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
};

const createFetchMock = (): jest.Mock => {
  const fetchMock = jest.fn();
  const mockResolvedValueOnce = fetchMock.mockResolvedValueOnce.bind(fetchMock);

  fetchMock.mockResolvedValueOnce = (response: MockFetchResponse) =>
    mockResolvedValueOnce(normalizeMockResponse(response));

  return fetchMock;
};

describe('API Service Tests', () => {
  beforeEach(() => {
    global.fetch = createFetchMock();
    global.localStorage = {
      getItem: jest.fn().mockReturnValue(null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateResponse', () => {
    it('should return true for response with data and message', () => {
      const successResponse: ApiResponse = {
        data: {},
        message: 'Success',
      };
      expect(validateResponse(successResponse)).toBe(true);
    });

    it('should return false for error response', () => {
      const errorResponse = {
        statusCode: 400,
        message: 'Error',
        error: 'Bad Request',
      };
      expect(validateResponse(errorResponse)).toBe(false);
    });
  });

  describe('teamApi', () => {
    const mockTeamDTO: TeamDTO = {
      teamName: '测试队',
      homeJerseyColor: '红色',
      awayJerseyColor: '白色',
    };

    const mockCreatedTeam: TeamDTO = {
      ...mockTeamDTO,
      id: 'clx1234567890',
      players: [],
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z',
    };

    it('create should send POST request with correct data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValueOnce(mockCreatedTeam),
      });

      const result = await teamApi.create(mockTeamDTO);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/teams',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify(mockTeamDTO),
        }
      );
      expect(result).toEqual(mockCreatedTeam);
    });

    it('create should throw error when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({
          statusCode: 409,
          message: '球队名称已存在',
          error: 'Conflict',
        }),
      });

      await expect(teamApi.create(mockTeamDTO)).rejects.toThrow('球队名称已存在');
    });

    it('getAll should send GET request with pagination params', async () => {
      const mockListResponse = {
        data: [mockCreatedTeam],
        total: 1,
        page: 1,
        limit: 10,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockListResponse),
      });

      const result = await teamApi.getAll(1, 10);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/teams?page=1&limit=10',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockListResponse);
    });

    it('search should send GET request with name parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([mockCreatedTeam]),
      });

      const result = await teamApi.search('测试');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/teams/search?name=%E6%B5%8B%E8%AF%95',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual([mockCreatedTeam]);
    });

    it('getById should send GET request with team id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockCreatedTeam),
      });

      const result = await teamApi.getById('clx1234567890');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/teams/clx1234567890',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockCreatedTeam);
    });

    it('update should send PATCH request with team id and data', async () => {
      const updatedTeam = { ...mockCreatedTeam, teamName: '更新队名' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(updatedTeam),
      });

      const result = await teamApi.update('clx1234567890', { teamName: '更新队名' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/teams/clx1234567890',
        {
          method: 'PATCH',
          headers: expect.any(Headers),
          body: JSON.stringify({ teamName: '更新队名' }),
        }
      );
      expect(result).toEqual(updatedTeam);
    });

    it('delete should send DELETE request with team id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockCreatedTeam),
      });

      const result = await teamApi.delete('clx1234567890');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/teams/clx1234567890',
        {
          method: 'DELETE',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockCreatedTeam);
    });
  });

  describe('playerApi', () => {
    const mockPlayerDTO: PlayerDTO = {
      name: '张三',
      studentId: '20210001',
      jerseyNumber: '10',
      teamId: 'clx1234567890',
    };

    const mockCreatedPlayer: PlayerDTO = {
      ...mockPlayerDTO,
      id: 'clxplayer123',
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z',
    };

    it('create should send POST request with correct data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValueOnce(mockCreatedPlayer),
      });

      const result = await playerApi.create(mockPlayerDTO);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/players',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify(mockPlayerDTO),
        }
      );
      expect(result).toEqual(mockCreatedPlayer);
    });

    it('getAll should send GET request with pagination and optional teamId', async () => {
      const mockListResponse = {
        data: [mockCreatedPlayer],
        total: 1,
        page: 1,
        limit: 10,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockListResponse),
      });

      const result = await playerApi.getAll(1, 10, 'clx1234567890');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/players?page=1&limit=10&teamId=clx1234567890',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockListResponse);
    });

    it('search should send GET request with name parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce([mockCreatedPlayer]),
      });

      const result = await playerApi.search('张');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/players/search?name=%E5%BC%A0',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual([mockCreatedPlayer]);
    });

    it('getById should send GET request with player id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockCreatedPlayer),
      });

      const result = await playerApi.getById('clxplayer123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/players/clxplayer123',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockCreatedPlayer);
    });

    it('update should send PATCH request with player id', async () => {
      const updatedPlayer = { ...mockCreatedPlayer, name: '李四' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(updatedPlayer),
      });

      const result = await playerApi.update('clxplayer123', { name: '李四' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/players/clxplayer123',
        {
          method: 'PATCH',
          headers: expect.any(Headers),
          body: JSON.stringify({ name: '李四' }),
        }
      );
      expect(result).toEqual(updatedPlayer);
    });

    it('delete should send DELETE request with player id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockCreatedPlayer),
      });

      const result = await playerApi.delete('clxplayer123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/players/clxplayer123',
        {
          method: 'DELETE',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockCreatedPlayer);
    });
  });

  describe('matchApi', () => {
    const mockMatchDTO: MatchDTO = {
      homeTeamId: 'clx1234567890',
      awayTeamId: 'clx9876543210',
      homeScore: 0,
      awayScore: 0,
      matchDate: '2024-01-20T14:00:00.000Z',
      location: '学校足球场',
      status: 'scheduled',
    };

    const mockCreatedMatch: MatchDTO = {
      ...mockMatchDTO,
      id: 'clxmatch123',
      createdAt: '2024-01-15T10:00:00.000Z',
      updatedAt: '2024-01-15T10:00:00.000Z',
    };

    it('create should send POST request with correct data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValueOnce(mockCreatedMatch),
      });

      const result = await matchApi.create(mockMatchDTO);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/matches',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify(mockMatchDTO),
        }
      );
      expect(result).toEqual(mockCreatedMatch);
    });

    it('getAll should send GET request with pagination and optional teamId', async () => {
      const mockListResponse = {
        data: [mockCreatedMatch],
        total: 1,
        page: 1,
        limit: 10,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockListResponse),
      });

      const result = await matchApi.getAll(1, 10, 'clx1234567890');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/matches?page=1&limit=10&teamId=clx1234567890',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockListResponse);
    });

    it('getById should send GET request with match id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockCreatedMatch),
      });

      const result = await matchApi.getById('clxmatch123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/matches/clxmatch123',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockCreatedMatch);
    });

    it('update should send PATCH request with match id', async () => {
      const updatedMatch = { ...mockCreatedMatch, homeScore: 3, awayScore: 2, status: 'finished' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(updatedMatch),
      });

      const result = await matchApi.update('clxmatch123', { homeScore: 3, awayScore: 2, status: 'finished' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/matches/clxmatch123',
        {
          method: 'PATCH',
          headers: expect.any(Headers),
          body: JSON.stringify({ homeScore: 3, awayScore: 2, status: 'finished' }),
        }
      );
      expect(result).toEqual(updatedMatch);
    });

    it('delete should send DELETE request with match id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockCreatedMatch),
      });

      const result = await matchApi.delete('clxmatch123');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/matches/clxmatch123',
        {
          method: 'DELETE',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockCreatedMatch);
    });
  });

  describe('authApi', () => {
    it('login should send POST request with credentials', async () => {
      const mockLoginResponse = {
        user: { id: 'clx1234567890', username: 'admin', role: 'admin' },
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockLoginResponse),
      });

      const result = await authApi.login({ username: 'admin', password: 'password123' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/auth/login',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify({ username: 'admin', password: 'password123' }),
        }
      );
      expect(result).toEqual(mockLoginResponse);
    });

    it('createUser should send POST request with username, password and optional role', async () => {
      const mockCreateUserResponse = {
        user: { id: 'clx1234567890', username: 'admin', role: 'admin', createdAt: '2024-01-15T10:00:00.000Z' },
        token: 'eyJhbG...VCJ9...',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValueOnce(mockCreateUserResponse),
      });

      const result = await authApi.createUser({ username: 'admin', password: 'password123', role: 'admin' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/auth/register',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify({ username: 'admin', password: 'password123', role: 'admin' }),
        }
      );
      expect(result).toEqual(mockCreateUserResponse);
    });

    it('login should throw error for invalid credentials', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce({
          statusCode: 401,
          message: '用户名或密码错误',
          error: 'Unauthorized',
        }),
      });

      await expect(authApi.login({ username: 'admin', password: 'wrongpassword' })).rejects.toThrow('用户名或密码错误');
    });
  });

  describe('importApi', () => {
    it('importFromJson should send POST request with filePath', async () => {
      const mockImportResponse: ApiResponse<{ result: { teams: number; players: number } }> = {
        data: { result: { teams: 10, players: 150 } },
        message: '导入完成',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockImportResponse),
      });

      const result = await importApi.importFromJson('/data/teams.json');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.sztufa.xyz/api/v1/import/json',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify({ filePath: '/data/teams.json' }),
        }
      );
      expect(result).toEqual(mockImportResponse);
    });
  });
});

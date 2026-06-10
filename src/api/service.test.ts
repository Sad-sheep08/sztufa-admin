import { teamApi, matchApi, authApi, validateResponse } from './service';
import { ApiResponse, TeamDTO, MatchDTO } from './types';

describe('API Service Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
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
    it('should return true for successful response', () => {
      const successResponse: ApiResponse = {
        success: true,
        message: 'Success',
        data: {},
      };
      expect(validateResponse(successResponse)).toBe(true);
    });

    it('should return false for failed response', () => {
      const errorResponse = {
        success: false,
        message: 'Error',
        errors: { field: ['error message'] },
      };
      expect(validateResponse(errorResponse)).toBe(false);
    });
  });

  describe('teamApi', () => {
    const mockTeamDTO: TeamDTO = {
      teamName: '测试队',
      teamDoctor: '张医生',
      headCoach: '李教练',
      teamLeader: '王领队',
      coachPhone: '13800138000',
      leaderPhone: '13900139000',
      homeJerseyColor: '红色',
      awayJerseyColor: '白色',
      players: [],
    };

    const mockSuccessResponse: ApiResponse<TeamDTO> = {
      success: true,
      message: '创建成功',
      data: { ...mockTeamDTO, id: '1' },
    };

    it('create should send POST request with correct data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockSuccessResponse),
      });

      const result = await teamApi.create(mockTeamDTO);

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/teams',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify(mockTeamDTO),
        }
      );
      expect(result).toEqual(mockSuccessResponse);
    });

    it('create should throw error when network fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(teamApi.create(mockTeamDTO)).rejects.toThrow('Failed to fetch');
    });

    it('getAll should send GET request with pagination params', async () => {
      const mockListResponse: ApiResponse<{ teams: TeamDTO[]; total: number }> = {
        success: true,
        message: 'Success',
        data: { teams: [mockTeamDTO], total: 1 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockListResponse),
      });

      const result = await teamApi.getAll(2, 20);

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/teams?page=2&limit=20',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockListResponse);
    });

    it('getById should send GET request with team id', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockSuccessResponse),
      });

      const result = await teamApi.getById('123');

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/teams/123',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockSuccessResponse);
    });

    it('update should send PUT request with team id and data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockSuccessResponse),
      });

      const result = await teamApi.update('123', { teamName: '更新队名' });

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/teams/123',
        {
          method: 'PUT',
          headers: expect.any(Headers),
          body: JSON.stringify({ teamName: '更新队名' }),
        }
      );
      expect(result).toEqual(mockSuccessResponse);
    });

    it('delete should send DELETE request with team id', async () => {
      const mockDeleteResponse: ApiResponse<void> = {
        success: true,
        message: '删除成功',
        data: undefined,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockDeleteResponse),
      });

      const result = await teamApi.delete('123');

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/teams/123',
        {
          method: 'DELETE',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockDeleteResponse);
    });
  });

  describe('matchApi', () => {
    const mockMatchDTO: MatchDTO = {
      matchName: '决赛',
      matchTime: '2024-01-01T14:00:00',
      homeTeamName: '主队',
      awayTeamName: '客队',
      homeTeamScore: 2,
      awayTeamScore: 1,
      homeTeamGoals: [
        { playerName: '张三', goalTime: '30\'', jerseyNumber: '10' },
        { playerName: '李四', goalTime: '60\'', jerseyNumber: '7' },
      ],
      awayTeamGoals: [{ playerName: '王五', goalTime: '45\'', jerseyNumber: '9' }],
    };

    const mockSuccessResponse: ApiResponse<MatchDTO> = {
      success: true,
      message: '创建成功',
      data: { ...mockMatchDTO, id: '1' },
    };

    it('create should send POST request with correct data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockSuccessResponse),
      });

      const result = await matchApi.create(mockMatchDTO);

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/matches',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify(mockMatchDTO),
        }
      );
      expect(result).toEqual(mockSuccessResponse);
    });

    it('create should handle non-ok response', async () => {
      const errorResponse = {
        success: false,
        message: '验证失败',
        errors: { matchName: ['比赛名称不能为空'] },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValueOnce(errorResponse),
      });

      await expect(matchApi.create(mockMatchDTO)).rejects.toThrow('验证失败');
    });

    it('getAll should send GET request with pagination', async () => {
      const mockListResponse: ApiResponse<{ matches: MatchDTO[]; total: number }> = {
        success: true,
        message: 'Success',
        data: { matches: [mockMatchDTO], total: 1 },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockListResponse),
      });

      const result = await matchApi.getAll();

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/matches?page=1&limit=10',
        {
          method: 'GET',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockListResponse);
    });

    it('update should send PUT request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockSuccessResponse),
      });

      const result = await matchApi.update('456', { matchName: '半决赛' });

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/matches/456',
        {
          method: 'PUT',
          headers: expect.any(Headers),
          body: JSON.stringify({ matchName: '半决赛' }),
        }
      );
      expect(result).toEqual(mockSuccessResponse);
    });

    it('delete should send DELETE request', async () => {
      const mockDeleteResponse: ApiResponse<void> = {
        success: true,
        message: '删除成功',
        data: undefined,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockDeleteResponse),
      });

      const result = await matchApi.delete('456');

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/matches/456',
        {
          method: 'DELETE',
          headers: expect.any(Headers),
        }
      );
      expect(result).toEqual(mockDeleteResponse);
    });
  });

  describe('authApi', () => {
    it('login should send POST request with credentials', async () => {
      const mockLoginResponse: ApiResponse<{ token: string; user: unknown }> = {
        success: true,
        message: '登录成功',
        data: { token: 'test-token', user: { id: '1', username: 'admin' } },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockLoginResponse),
      });

      const result = await authApi.login('admin', 'password');

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/auth/login',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify({ username: 'admin', password: 'password' }),
        }
      );
      expect(result).toEqual(mockLoginResponse);
    });

    it('register should send POST request with credentials', async () => {
      const mockRegisterResponse: ApiResponse<{ user: unknown }> = {
        success: true,
        message: '注册成功',
        data: { user: { id: '1', username: 'admin' } },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockRegisterResponse),
      });

      const result = await authApi.register('admin', 'password');

      expect(fetch).toHaveBeenCalledWith(
        'https://sztufa-server.vercel.app/api/auth/register',
        {
          method: 'POST',
          headers: expect.any(Headers),
          body: JSON.stringify({ username: 'admin', password: 'password' }),
        }
      );
      expect(result).toEqual(mockRegisterResponse);
    });
  });
});
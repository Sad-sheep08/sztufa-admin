import { useCallback, useEffect, useState } from 'react';
import { teamApi } from '../../../api/service';
import { TeamDTO } from '../../../api/types';

export const useSystemTeams = () => {
  const [teams, setTeams] = useState<TeamDTO[]>([]);

  const loadTeams = useCallback(async () => {
    try {
      const response = await teamApi.getAll();
      setTeams(response.data || []);
    } catch (error) {
      console.error('加载球队列表失败:', error);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  return { teams, loadTeams };
};

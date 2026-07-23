import { useState, useEffect } from 'react';
import { Goal, MatchFormData, Match, MatchEvent } from '../../../types';
import { generateId } from '../../../utils';
import { matchApi, teamApi, seasonApi } from '../../../api/service';
import { TeamDTO, PlayerDTO } from '../../../api/types';
import { buildMatchDto, filterTeamsForGroup, MatchLineup, validateMatchForm } from '../utils/matchForm';
import { applyEventTypeDefaults } from '../../../utils/matchEvents';

export const useMatchForm = () => {
  const [formData, setFormData] = useState<MatchFormData>({
    matchName: '',
    matchTime: '',
    homeTeamName: '',
    awayTeamName: '',
    homeTeamScore: '',
    awayTeamScore: '',
    homeTeamGoals: [],
    awayTeamGoals: [],
    events: [],
    homeTeamId: '',
    awayTeamId: '',
    matchDate: '',
    location: '',
    status: 'finished',
    stage: 'LEAGUE',
    groupName: '',
    knockoutRound: '',
    knockoutMatchIndex: '',
    seasonId: '',
  });

  const [activeSeasons, setActiveSeasons] = useState<any[]>([]);
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [seasonGroups, setSeasonGroups] = useState<any[]>([]);

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingTeams, setIsVerifyingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMatch, setSavedMatch] = useState<Match | null>(null);
  const [availableTeams, setAvailableTeams] = useState<TeamDTO[]>([]);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<PlayerDTO[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<PlayerDTO[]>([]);
  const [lineups, setLineups] = useState<MatchLineup[]>([]);

  const handleLineupChange = (playerId: string, teamType: 'home' | 'away', lineupType: 'starting' | 'substitute' | 'none') => {
    let updatedLineups = [...lineups];
    updatedLineups = updatedLineups.filter(l => l.playerId !== playerId);
    if (lineupType !== 'none') {
      updatedLineups.push({
        playerId,
        teamType,
        lineupType
      });
    }
    setLineups(updatedLineups);
  };

  const loadTeams = async (seasonId?: string) => {
    try {
      const response = await teamApi.getAll(1, 100, seasonId);
      setAvailableTeams(response.data);
    } catch (err) {
      console.error('加载球队列表失败:', err);
    }
  };

  const loadTeamPlayers = async (teamId: string, teamType: 'home' | 'away') => {
    if (!teamId) {
      if (teamType === 'home') setHomeTeamPlayers([]);
      else setAwayTeamPlayers([]);
      return;
    }
    try {
      const players = await teamApi.getPlayers(teamId, formData.seasonId || undefined);
      let playerList = Array.isArray(players) ? players : (players as any)?.data ?? [];

      // 若名册 API 返回空数组，触发多重兜底机制获取球队球员
      if (playerList.length === 0) {
        const cachedTeam = availableTeams.find(t => t.id === teamId);
        if (cachedTeam?.players && cachedTeam.players.length > 0) {
          playerList = cachedTeam.players;
        } else {
          try {
            const fullTeam = await teamApi.getById(teamId);
            if (fullTeam?.players && fullTeam.players.length > 0) {
              playerList = fullTeam.players;
            }
          } catch (fetchErr) {
            console.error('获取球队详情球员失败:', fetchErr);
          }
        }
      }

      if (teamType === 'home') {
        setHomeTeamPlayers(playerList);
      } else {
        setAwayTeamPlayers(playerList);
      }
    } catch (err) {
      console.error('加载球队球员失败:', err);
      const cachedTeam = availableTeams.find(t => t.id === teamId);
      if (cachedTeam?.players && cachedTeam.players.length > 0) {
        if (teamType === 'home') {
          setHomeTeamPlayers(cachedTeam.players);
        } else {
          setAwayTeamPlayers(cachedTeam.players);
        }
      } else {
        setError('加载球队名单失败，请检查是否已有活跃赛季，或球队是否已录入球员名册');
      }
    }
  };

  const loadActiveSeasons = async () => {
    try {
      const allSeasons = await seasonApi.getAll();
      const actives = (allSeasons || []).filter((s: any) => s.status === 'active');
      setActiveSeasons(actives);
      
      if (actives.length > 0) {
        const defaultSeason = actives[0];
        setActiveSeason(defaultSeason);
        setFormData(prev => ({ ...prev, seasonId: defaultSeason.id }));
        await loadTeams(defaultSeason.id);
        
        if (defaultSeason.type === 'CUP') {
          const groups = await seasonApi.getGroups(defaultSeason.id);
          setSeasonGroups(groups || []);
          setFormData(prev => ({ ...prev, seasonId: defaultSeason.id, stage: 'GROUP', groupName: 'A' }));
        } else {
          setFormData(prev => ({ ...prev, seasonId: defaultSeason.id, stage: 'LEAGUE' }));
        }
      }
    } catch (err) {
      console.error('加载活跃赛季列表失败:', err);
    }
  };

  const handleSeasonSelect = async (seasonId: string) => {
    const selected = activeSeasons.find(s => s.id === seasonId);
    if (!selected) return;

    setActiveSeason(selected);
    await loadTeams(seasonId);
    setFormData(prev => ({
      ...prev,
      seasonId,
      stage: selected.type === 'CUP' ? 'GROUP' : 'LEAGUE',
      groupName: selected.type === 'CUP' ? 'A' : '',
      knockoutRound: '',
      knockoutMatchIndex: '',
    }));

    if (selected.type === 'CUP') {
      try {
        const groups = await seasonApi.getGroups(seasonId);
        setSeasonGroups(groups || []);
      } catch (err) {
        console.error('加载赛季分组失败:', err);
      }
    } else {
      setSeasonGroups([]);
    }
  };

  useEffect(() => {
    loadTeams();
    loadActiveSeasons();
  }, []);

  useEffect(() => {
    if (formData.homeTeamId) {
      loadTeamPlayers(formData.homeTeamId, 'home');
    }
  }, [formData.homeTeamId, formData.seasonId, availableTeams]);

  useEffect(() => {
    if (formData.awayTeamId) {
      loadTeamPlayers(formData.awayTeamId, 'away');
    }
  }, [formData.awayTeamId, formData.seasonId, availableTeams]);

  const getFilteredTeams = () => {
    if (activeSeason?.type === 'CUP' && formData.stage === 'GROUP') {
      const gName = formData.groupName || 'A';
      return filterTeamsForGroup(availableTeams, seasonGroups, gName);
    }
    return availableTeams;
  };

  const addEvent = (team: 'home' | 'away') => {
    const newEvent: MatchEvent = {
      eventTime: '',
      eventType: 'goal',
      playerId: '',
      playerName: '',
      jerseyNumber: '',
      description: '',
      teamType: team,
    };
    setFormData({
      ...formData,
      events: [...(formData.events || []), newEvent],
    });
    setError(null);
  };

  const removeEvent = (index: number) => {
    setFormData({
      ...formData,
      events: formData.events.filter((_, i) => i !== index),
    });
    setError(null);
  };

  const updateEvent = (index: number, field: keyof MatchEvent, value: any) => {
    const updatedEvents = [...formData.events];
    let newEvent = { ...updatedEvents[index], [field]: value } as MatchEvent;
    
    if (field === 'eventType') {
      newEvent = applyEventTypeDefaults(
        updatedEvents[index],
        value as MatchEvent['eventType'],
        updatedEvents,
      );
      if (value !== 'goal') {
        newEvent.assistPlayerId = null;
        newEvent.assistPlayerName = null;
        newEvent.assistJerseyNumber = null;
      }
      if (value !== 'substitution') {
        newEvent.subPlayerId = undefined;
        newEvent.subPlayerName = undefined;
        newEvent.subJerseyNumber = undefined;
      }
    }
    
    updatedEvents[index] = newEvent;
    setFormData({ ...formData, events: updatedEvents });
    setError(null);
  };

  const handleEventPlayerSelect = (index: number, playerId: string) => {
    const event = formData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);
    
    const updatedEvents = [...formData.events];
    updatedEvents[index] = {
      ...updatedEvents[index],
      playerId: player?.id || '',
      playerName: player?.name || '',
      jerseyNumber: player?.jerseyNumber || '',
    };
    setFormData({ ...formData, events: updatedEvents });
    setError(null);
  };

  const handleSubPlayerSelect = (index: number, playerId: string) => {
    const event = formData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);
    
    const updatedEvents = [...formData.events];
    updatedEvents[index] = {
      ...updatedEvents[index],
      subPlayerId: player?.id || '',
      subPlayerName: player?.name || '',
      subJerseyNumber: player?.jerseyNumber || '',
    };
    setFormData({ ...formData, events: updatedEvents });
    setError(null);
  };

  const handleAssistPlayerSelect = (index: number, playerId: string) => {
    const event = formData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);
    
    const updatedEvents = [...formData.events];
    updatedEvents[index] = {
      ...updatedEvents[index],
      assistPlayerId: player?.id || null,
      assistPlayerName: player?.name || null,
      assistJerseyNumber: player?.jerseyNumber || null,
    };
    setFormData({ ...formData, events: updatedEvents });
    setError(null);
  };

  const validateTeamId = async (teamId: string): Promise<boolean> => {
    if (!teamId.trim()) {
      return true;
    }
    try {
      await teamApi.getById(teamId);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateMatchForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (formData.homeTeamId.trim()) {
        setIsVerifyingTeams(true);
        const homeTeamValid = await validateTeamId(formData.homeTeamId);
        if (!homeTeamValid) {
          setError(`主队ID ${formData.homeTeamId} 不存在，请检查或使用球队名称`);
          setIsLoading(false);
          setIsVerifyingTeams(false);
          return;
        }
      }

      if (formData.awayTeamId.trim()) {
        const awayTeamValid = await validateTeamId(formData.awayTeamId);
        if (!awayTeamValid) {
          setError(`客队ID ${formData.awayTeamId} 不存在，请检查或使用球队名称`);
          setIsLoading(false);
          setIsVerifyingTeams(false);
          return;
        }
      }
      setIsVerifyingTeams(false);

      const matchDTO = buildMatchDto(formData, lineups);

      console.log('正在提交比赛数据到后端:', matchDTO);
      const response = await matchApi.create(matchDTO);

      const savedData = response;
      const match: Match = {
        id: savedData.id || generateId(),
        matchName: `${savedData.homeTeam?.teamName || '主队'} vs ${savedData.awayTeam?.teamName || '客队'}`,
        matchTime: savedData.matchDate,
        homeScore: savedData.homeScore,
        awayScore: savedData.awayScore,
        homePenaltyScore: savedData.homePenaltyScore,
        awayPenaltyScore: savedData.awayPenaltyScore,
        winnerTeamId: savedData.winnerTeamId,
        decidedBy: savedData.decidedBy,
        homeTeamGoals: [],
        awayTeamGoals: [],
        events: savedData.events || [],
        homeTeamId: savedData.homeTeamId,
        awayTeamId: savedData.awayTeamId,
        homeTeamName: savedData.homeTeam?.teamName,
        awayTeamName: savedData.awayTeam?.teamName,
        location: savedData.location,
        status: savedData.status || 'finished',
      };

      setSavedMatch(match);
      setIsSaved(true);
      setError(null);
      setLineups([]);

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);

      console.log('比赛信息已成功保存到后端:', match);
    } catch (err) {
      console.error('保存比赛信息失败:', err);
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          setError('网络连接失败，请检查网络或稍后重试');
        } else if (err.message.includes('400')) {
          setError('请求参数错误，请检查表单数据是否完整');
        } else if (err.message.includes('401')) {
          setError('未授权访问，请先登录');
        } else if (err.message.includes('404')) {
          setError('关联的球队不存在，请检查球队ID');
        } else if (err.message.includes('500')) {
          setError('服务器内部错误，请稍后重试');
        } else {
          setError('保存失败: ' + err.message);
        }
      } else {
        setError('保存失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
      setIsVerifyingTeams(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const handleTeamSelect = (teamType: 'home' | 'away', team: TeamDTO) => {
    if (teamType === 'home') {
      setFormData({
        ...formData,
        homeTeamId: team.id || '',
        homeTeamName: team.teamName,
      });
      loadTeamPlayers(team.id || '', 'home');
      setLineups(prev => prev.filter(l => l.teamType !== 'home'));
    } else {
      setFormData({
        ...formData,
        awayTeamId: team.id || '',
        awayTeamName: team.teamName,
      });
      loadTeamPlayers(team.id || '', 'away');
      setLineups(prev => prev.filter(l => l.teamType !== 'away'));
    }
    setError(null);
  };

  return {
    formData,
    setFormData,
    activeSeasons,
    activeSeason,
    seasonGroups,
    isSaved,
    isLoading,
    isVerifyingTeams,
    error,
    setError,
    savedMatch,
    availableTeams,
    homeTeamPlayers,
    awayTeamPlayers,
    lineups,
    handleLineupChange,
    handleSeasonSelect,
    getFilteredTeams,
    addEvent,
    removeEvent,
    updateEvent,
    handleEventPlayerSelect,
    handleSubPlayerSelect,
    handleAssistPlayerSelect,
    handleSubmit,
    handleChange,
    handleTeamSelect,
  };
};

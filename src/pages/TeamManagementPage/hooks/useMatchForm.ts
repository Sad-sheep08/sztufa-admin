import { useState, useEffect } from 'react';
import { Goal, MatchFormData, Match, MatchEvent } from '../../../types';
import { generateId } from '../../../utils';
import { matchApi, teamApi, seasonApi } from '../../../api/service';
import { MatchDTO, TeamDTO, PlayerDTO } from '../../../api/types';

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
  const [lineups, setLineups] = useState<{ playerId: string; teamType: 'home' | 'away'; lineupType: 'starting' | 'substitute' }[]>([]);

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

  const loadTeams = async () => {
    try {
      const response = await teamApi.getAll();
      setAvailableTeams(response.data);
    } catch (err) {
      console.error('加载球队列表失败:', err);
    }
  };

  const loadTeamPlayers = async (teamId: string, teamType: 'home' | 'away') => {
    if (!teamId) return;
    try {
      const players = await teamApi.getPlayers(teamId);
      if (teamType === 'home') {
        setHomeTeamPlayers(players);
      } else {
        setAwayTeamPlayers(players);
      }
    } catch (err) {
      console.error('加载球队球员失败:', err);
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

  const getFilteredTeams = () => {
    if (activeSeason?.type === 'CUP' && formData.stage === 'GROUP') {
      const gName = formData.groupName || 'A';
      const groupTeamIds = seasonGroups
        .filter(g => g.groupName === gName)
        .map(g => g.teamId);
      return availableTeams.filter(t => groupTeamIds.includes(t.id));
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

  const validateForm = (): boolean => {
    if (!formData.matchName.trim()) {
      setError('请选择比赛名称');
      return false;
    }
    if (!formData.matchTime.trim()) {
      setError('请选择比赛时间');
      return false;
    }
    if (!formData.homeTeamName.trim()) {
      setError('请输入主队名称');
      return false;
    }
    if (!formData.awayTeamName.trim()) {
      setError('请输入客队名称');
      return false;
    }
    if (formData.homeTeamName === formData.awayTeamName) {
      setError('主队和客队不能相同');
      return false;
    }
    if (!formData.location.trim()) {
      setError('请输入比赛地点');
      return false;
    }
    if (!formData.homeTeamScore.trim()) {
      setError('请输入主队得分');
      return false;
    }
    if (!formData.awayTeamScore.trim()) {
      setError('请输入客队得分');
      return false;
    }

    const homeScore = parseInt(formData.homeTeamScore);
    const awayScore = parseInt(formData.awayTeamScore);

    if (isNaN(homeScore) || homeScore < 0) {
      setError('主队得分必须是非负整数');
      return false;
    }
    if (isNaN(awayScore) || awayScore < 0) {
      setError('客队得分必须是非负整数');
      return false;
    }

    // 主队总得分 = 主队普通进球 + 主队点球 + 客队乌龙球
    const homeGoalsCount = formData.events.filter(e => e.teamType === 'home' && (e.eventType === 'goal' || e.eventType === 'penalty')).length +
                           formData.events.filter(e => e.teamType === 'away' && e.eventType === 'own_goal').length;
    // 客队总得分 = 客队普通进球 + 客队点球 + 主队乌龙球
    const awayGoalsCount = formData.events.filter(e => e.teamType === 'away' && (e.eventType === 'goal' || e.eventType === 'penalty')).length +
                           formData.events.filter(e => e.teamType === 'home' && e.eventType === 'own_goal').length;

    if (homeScore !== homeGoalsCount) {
      setError(`主队进球/点球/对方乌龙数(${homeGoalsCount})与主队得分(${homeScore})不一致`);
      return false;
    }
    if (awayScore !== awayGoalsCount) {
      setError(`客队进球/点球/对方乌龙数(${awayGoalsCount})与客队得分(${awayScore})不一致`);
      return false;
    }

    if (formData.events) {
      for (const event of formData.events) {
        if (!event.eventTime.trim()) {
          setError('请填写所有事件的时间');
          return false;
        }
        if (event.eventType === 'substitution') {
          if (!event.playerId) {
            setError('请选择换人事件的换上球员');
            return false;
          }
          if (!event.subPlayerId) {
            setError('请选择换人事件的换下球员');
            return false;
          }
          if (event.playerId === event.subPlayerId) {
            setError('换上球员与换下球员不能相同');
            return false;
          }
        } else {
          if (!event.playerId) {
            setError('请选择事件关联的球员');
            return false;
          }
        }
      }

      // 校验换下后不能再换上，以及已换下球员不能再次换下
      const homeSubbedOff = new Set<string>();
      const awaySubbedOff = new Set<string>();

      const sortedEvents = [...formData.events].sort((a, b) => {
        const parseTime = (t: string) => parseInt(t.replace(/'/g, '')) || 0;
        return parseTime(a.eventTime) - parseTime(b.eventTime);
      });

      for (const event of sortedEvents) {
        if (event.eventType === 'substitution') {
          const subbedOffSet = event.teamType === 'home' ? homeSubbedOff : awaySubbedOff;
          
          if (event.playerId && subbedOffSet.has(event.playerId)) {
            setError(`换人错误：球员 ${event.playerName} 已经被换下过，不能再次换上`);
            return false;
          }
          
          if (event.subPlayerId && subbedOffSet.has(event.subPlayerId)) {
            setError(`换人错误：球员 ${event.subPlayerName} 已经被换下过，不能再次换下`);
            return false;
          }

          if (event.subPlayerId) {
            subbedOffSet.add(event.subPlayerId);
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
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

      const matchDate = new Date(formData.matchTime).toISOString();

      // 映射事件数据
      const events = formData.events.map(e => ({
        eventTime: e.eventTime,
        eventType: e.eventType,
        description: e.description || (
          e.eventType === 'substitution'
            ? `换上 ${e.playerName} (${e.jerseyNumber}号)，换下 ${e.subPlayerName} (${e.subJerseyNumber}号)`
            : e.eventType === 'own_goal'
              ? `乌龙球`
              : e.eventType === 'penalty'
                ? `点球`
                : `进球`
        ),
        teamType: e.teamType,
        playerId: e.playerId || null,
        playerName: e.playerName || null,
        jerseyNumber: e.jerseyNumber || null,
        subPlayerId: e.subPlayerId || null,
        subPlayerName: e.subPlayerName || null,
        subJerseyNumber: e.subJerseyNumber || null,
      }));

      // 提取所有进球/点球/乌龙球，同步至 Goal 表以向下兼容
      const goals = events
        .filter(e => e.eventType === 'goal' || e.eventType === 'penalty' || e.eventType === 'own_goal')
        .map(e => ({
          playerName: e.eventType === 'own_goal' ? `${e.playerName} (乌龙)` : e.eventType === 'penalty' ? `${e.playerName} (点球)` : e.playerName || '',
          goalTime: e.eventTime,
          jerseyNumber: e.jerseyNumber || '',
          teamType: e.eventType === 'own_goal' ? (e.teamType === 'home' ? 'away' : 'home') : e.teamType,
          playerId: e.playerId || null
        }));

      const matchDTO: MatchDTO = {
        homeTeamId: formData.homeTeamId,
        awayTeamId: formData.awayTeamId,
        homeScore: parseInt(formData.homeTeamScore) || 0,
        awayScore: parseInt(formData.awayTeamScore) || 0,
        matchDate: matchDate,
        location: formData.location,
        status: (formData.status as any) || 'finished',
        goals: goals,
        events: events,
        stage: formData.stage || 'LEAGUE',
        groupName: formData.stage === 'GROUP' ? formData.groupName : undefined,
        knockoutRound: formData.stage === 'KNOCKOUT' ? formData.knockoutRound : undefined,
        knockoutMatchIndex: formData.stage === 'KNOCKOUT' ? parseInt(formData.knockoutMatchIndex || '1', 10) : undefined,
        seasonId: formData.seasonId || undefined,
        lineups: lineups.map(l => ({
          playerId: l.playerId,
          teamType: l.teamType,
          lineupType: l.lineupType
        }))
      };

      console.log('正在提交比赛数据到后端:', matchDTO);
      const response = await matchApi.create(matchDTO);

      const savedData = response;
       const match: Match = {
        id: savedData.id || generateId(),
        matchName: `${savedData.homeTeam?.teamName || '主队'} vs ${savedData.awayTeam?.teamName || '客队'}`,
        matchTime: savedData.matchDate,
        homeScore: savedData.homeScore,
        awayScore: savedData.awayScore,
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

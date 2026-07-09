import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Save, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Goal, MatchFormData, Match, MatchEvent } from '../types';
import { generateId } from '../utils';
import { matchApi, teamApi, playerApi } from '../api/service';
import { MatchDTO, TeamDTO, PlayerDTO } from '../api/types';

const TeamManagementPage: React.FC = () => {
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
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingTeams, setIsVerifyingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMatch, setSavedMatch] = useState<Match | null>(null);
  const [availableTeams, setAvailableTeams] = useState<TeamDTO[]>([]);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<PlayerDTO[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<PlayerDTO[]>([]);

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
      const response = await playerApi.getAll(1, 100, teamId);
      if (teamType === 'home') {
        setHomeTeamPlayers(response.data);
      } else {
        setAwayTeamPlayers(response.data);
      }
    } catch (err) {
      console.error('加载球队球员失败:', err);
    }
  };

  React.useEffect(() => {
    loadTeams();
  }, []);

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
        status: 'finished',
        goals: goals,
        events: events,
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
    } else {
      setFormData({
        ...formData,
        awayTeamId: team.id || '',
        awayTeamName: team.teamName,
      });
      loadTeamPlayers(team.id || '', 'away');
    }
    setError(null);
  };

  return (
    <div className="match-entry-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Calendar className="trophy-icon" />
            比赛信息录入
          </h1>
          <p>录入比赛时间、比分及进球球员信息</p>
        </div>
      </header>

      <main className="page-content">
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="form-title">
              <span className="icon">⚽</span>
              基本信息
            </h2>
            <div className="form-row">
              <div className="form-group">
                <label>比赛名称</label>
                <select
                  name="matchName"
                  value={formData.matchName}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">请选择比赛名称</option>
                  <option value="小组赛第一轮">小组赛第一轮</option>
                  <option value="小组赛第二轮">小组赛第二轮</option>
                  <option value="小组赛第三轮">小组赛第三轮</option>
                  <option value="八分之一决赛">八分之一决赛</option>
                  <option value="四分之一决赛">四分之一决赛</option>
                  <option value="半决赛">半决赛</option>
                  <option value="季军赛">季军赛</option>
                  <option value="决赛">决赛</option>
                </select>
              </div>

              <div className="form-group">
                <label>比赛时间</label>
                <input
                  type="datetime-local"
                  name="matchTime"
                  value={formData.matchTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>比赛地点</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="请输入比赛地点"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-title">
              <span className="icon">🏆</span>
              对阵球队
            </h2>
            <div className="match-score-container">
              <div className="team-column home-team">
                <div className="team-label">主队</div>
                <div className="team-select-wrapper">
                  <select
                    value={formData.homeTeamId}
                    onChange={(e) => {
                      const team = availableTeams.find(t => t.id === e.target.value);
                      if (team) {
                        handleTeamSelect('home', team);
                      } else {
                        setFormData({ ...formData, homeTeamId: e.target.value });
                      }
                    }}
                    className="form-select team-select"
                  >
                    <option value="">选择已有球队</option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id || ''}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="team-input-wrapper">
                  <input
                    type="text"
                    name="homeTeamName"
                    value={formData.homeTeamName}
                    onChange={handleChange}
                    className="form-input team-name-input"
                    placeholder="主队名称"
                    required
                  />
                </div>
                <div className="team-id-wrapper">
                  <input
                    type="text"
                    name="homeTeamId"
                    value={formData.homeTeamId}
                    onChange={handleChange}
                    className="form-input team-id-input"
                    placeholder="主队ID（可选）"
                  />
                </div>
                <div className="score-input-wrapper">
                  <input
                    type="number"
                    name="homeTeamScore"
                    value={formData.homeTeamScore}
                    onChange={handleChange}
                    className="form-input score-input"
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="vs-divider">
                <div className="vs-circle">
                  <span className="vs-text">VS</span>
                </div>
              </div>

              <div className="team-column away-team">
                <div className="team-label">客队</div>
                <div className="team-select-wrapper">
                  <select
                    value={formData.awayTeamId}
                    onChange={(e) => {
                      const team = availableTeams.find(t => t.id === e.target.value);
                      if (team) {
                        handleTeamSelect('away', team);
                      } else {
                        setFormData({ ...formData, awayTeamId: e.target.value });
                      }
                    }}
                    className="form-select team-select"
                  >
                    <option value="">选择已有球队</option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id || ''}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="team-input-wrapper">
                  <input
                    type="text"
                    name="awayTeamName"
                    value={formData.awayTeamName}
                    onChange={handleChange}
                    className="form-input team-name-input"
                    placeholder="客队名称"
                    required
                  />
                </div>
                <div className="team-id-wrapper">
                  <input
                    type="text"
                    name="awayTeamId"
                    value={formData.awayTeamId}
                    onChange={handleChange}
                    className="form-input team-id-input"
                    placeholder="客队ID（可选）"
                  />
                </div>
                <div className="score-input-wrapper">
                  <input
                    type="number"
                    name="awayTeamScore"
                    value={formData.awayTeamScore}
                    onChange={handleChange}
                    className="form-input score-input"
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 主队事件记录 */}
          <div className="form-section">
            <div className="section-header">
              <h2 className="form-title">
                <span className="icon">👕</span>
                主队事件记录（进球、换人、红黄牌）
              </h2>
              <button
                type="button"
                onClick={() => addEvent('home')}
                className="add-btn"
              >
                <Plus size={16} />
                添加主队事件
              </button>
            </div>
            {formData.events.filter(e => e.teamType === 'home').length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} />
                <p>暂无主队事件记录，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="player-table-wrapper">
                <table className="player-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>时间</th>
                      <th style={{ width: '150px' }}>事件类型</th>
                      <th style={{ width: '220px' }}>球员</th>
                      <th style={{ width: '120px' }}>号码</th>
                      <th>事件描述</th>
                      <th style={{ width: '80px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.events.map((event, index) => {
                      if (event.teamType !== 'home') return null;
                      return (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={event.eventTime}
                              onChange={(e) => updateEvent(index, 'eventTime', e.target.value)}
                              className="form-input inline"
                              placeholder="如：35'"
                              required
                            />
                          </td>
                          <td>
                            <select
                              value={event.eventType}
                              onChange={(e) => updateEvent(index, 'eventType', e.target.value as any)}
                              className="form-select inline"
                              required
                            >
                              <option value="goal">⚽ 普通进球</option>
                              <option value="penalty">🎯 点球</option>
                              <option value="own_goal">🥅 乌龙球</option>
                              <option value="substitution">🔄 换人</option>
                              <option value="yellow_card">🟨 黄牌</option>
                              <option value="red_card">🟥 红牌</option>
                            </select>
                          </td>
                          <td>
                            {event.eventType === 'substitution' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <select
                                  value={event.playerId || ''}
                                  onChange={(e) => handleEventPlayerSelect(index, e.target.value)}
                                  className="form-select inline"
                                  required
                                >
                                  <option value="">请选择换上球员</option>
                                  {homeTeamPlayers.map((player) => (
                                    <option key={player.id} value={player.id}>
                                      换上: {player.name} ({player.jerseyNumber}号)
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={event.subPlayerId || ''}
                                  onChange={(e) => handleSubPlayerSelect(index, e.target.value)}
                                  className="form-select inline"
                                  required
                                >
                                  <option value="">请选择换下球员</option>
                                  {homeTeamPlayers.map((player) => (
                                    <option key={player.id} value={player.id}>
                                      换下: {player.name} ({player.jerseyNumber}号)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <select
                                  value={event.playerId || ''}
                                  onChange={(e) => handleEventPlayerSelect(index, e.target.value)}
                                  className="form-select inline"
                                  required
                                >
                                  <option value="">请选择进球/得牌球员</option>
                                  {homeTeamPlayers.map((player) => (
                                    <option key={player.id} value={player.id}>
                                      {player.name} ({player.jerseyNumber}号)
                                    </option>
                                  ))}
                                </select>
                                {event.eventType === 'goal' && (
                                  <select
                                    value={event.assistPlayerId || ''}
                                    onChange={(e) => handleAssistPlayerSelect(index, e.target.value)}
                                    className="form-select inline"
                                    style={{ borderColor: '#adb5bd' }}
                                  >
                                    <option value="">（可选）请选择助攻球员</option>
                                    {homeTeamPlayers
                                      .filter(p => p.id !== event.playerId)
                                      .map((player) => (
                                        <option key={player.id} value={player.id}>
                                          助攻: {player.name} ({player.jerseyNumber}号)
                                        </option>
                                      ))}
                                  </select>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="form-value inline" style={{ fontSize: '0.85rem' }}>
                              {event.eventType === 'substitution' ? (
                                <span>
                                  上: {event.jerseyNumber || '-'} <br/>
                                  下: {event.subJerseyNumber || '-'}
                                </span>
                              ) : (
                                event.jerseyNumber || '-'
                              )}
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={event.description}
                              onChange={(e) => updateEvent(index, 'description', e.target.value)}
                              className="form-input inline"
                              placeholder={event.eventType === 'substitution' ? "选填，自动生成换人描述" : "选填，自动生成事件描述"}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeEvent(index)}
                              className="delete-btn"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 客队事件记录 */}
          <div className="form-section">
            <div className="section-header">
              <h2 className="form-title">
                <span className="icon">👚</span>
                客队事件记录（进球、换人、红黄牌）
              </h2>
              <button
                type="button"
                onClick={() => addEvent('away')}
                className="add-btn"
              >
                <Plus size={16} />
                添加客队事件
              </button>
            </div>
            {formData.events.filter(e => e.teamType === 'away').length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} />
                <p>暂无客队事件记录，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="player-table-wrapper">
                <table className="player-table">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>时间</th>
                      <th style={{ width: '150px' }}>事件类型</th>
                      <th style={{ width: '220px' }}>球员</th>
                      <th style={{ width: '120px' }}>号码</th>
                      <th>事件描述</th>
                      <th style={{ width: '80px' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.events.map((event, index) => {
                      if (event.teamType !== 'away') return null;
                      return (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              value={event.eventTime}
                              onChange={(e) => updateEvent(index, 'eventTime', e.target.value)}
                              className="form-input inline"
                              placeholder="如：35'"
                              required
                            />
                          </td>
                          <td>
                            <select
                              value={event.eventType}
                              onChange={(e) => updateEvent(index, 'eventType', e.target.value as any)}
                              className="form-select inline"
                              required
                            >
                              <option value="goal">⚽ 普通进球</option>
                              <option value="penalty">🎯 点球</option>
                              <option value="own_goal">🥅 乌龙球</option>
                              <option value="substitution">🔄 换人</option>
                              <option value="yellow_card">🟨 黄牌</option>
                              <option value="red_card">🟥 红牌</option>
                            </select>
                          </td>
                          <td>
                            {event.eventType === 'substitution' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <select
                                  value={event.playerId || ''}
                                  onChange={(e) => handleEventPlayerSelect(index, e.target.value)}
                                  className="form-select inline"
                                  required
                                >
                                  <option value="">请选择换上球员</option>
                                  {awayTeamPlayers.map((player) => (
                                    <option key={player.id} value={player.id}>
                                      换上: {player.name} ({player.jerseyNumber}号)
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={event.subPlayerId || ''}
                                  onChange={(e) => handleSubPlayerSelect(index, e.target.value)}
                                  className="form-select inline"
                                  required
                                >
                                  <option value="">请选择换下球员</option>
                                  {awayTeamPlayers.map((player) => (
                                    <option key={player.id} value={player.id}>
                                      换下: {player.name} ({player.jerseyNumber}号)
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <select
                                  value={event.playerId || ''}
                                  onChange={(e) => handleEventPlayerSelect(index, e.target.value)}
                                  className="form-select inline"
                                  required
                                >
                                  <option value="">请选择进球/得牌球员</option>
                                  {awayTeamPlayers.map((player) => (
                                    <option key={player.id} value={player.id}>
                                      {player.name} ({player.jerseyNumber}号)
                                    </option>
                                  ))}
                                </select>
                                {event.eventType === 'goal' && (
                                  <select
                                    value={event.assistPlayerId || ''}
                                    onChange={(e) => handleAssistPlayerSelect(index, e.target.value)}
                                    className="form-select inline"
                                    style={{ borderColor: '#adb5bd' }}
                                  >
                                    <option value="">（可选）请选择助攻球员</option>
                                    {awayTeamPlayers
                                      .filter(p => p.id !== event.playerId)
                                      .map((player) => (
                                        <option key={player.id} value={player.id}>
                                          助攻: {player.name} ({player.jerseyNumber}号)
                                        </option>
                                      ))}
                                  </select>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="form-value inline" style={{ fontSize: '0.85rem' }}>
                              {event.eventType === 'substitution' ? (
                                <span>
                                  上: {event.jerseyNumber || '-'} <br/>
                                  下: {event.subJerseyNumber || '-'}
                                </span>
                              ) : (
                                event.jerseyNumber || '-'
                              )}
                            </div>
                          </td>
                          <td>
                            <input
                              type="text"
                              value={event.description}
                              onChange={(e) => updateEvent(index, 'description', e.target.value)}
                              className="form-input inline"
                              placeholder={event.eventType === 'substitution' ? "选填，自动生成换人描述" : "选填，自动生成事件描述"}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => removeEvent(index)}
                              className="delete-btn"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </form>
      </main>

      <footer className="page-footer">
        <div className="footer-actions">
          <button 
            onClick={handleSubmit} 
            className="save-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="loader" />
                {isVerifyingTeams ? '验证球队信息中...' : '保存中...'}
              </>
            ) : (
              <>
                <Save size={18} />
                保存比赛信息
              </>
            )}
          </button>
        </div>
        {isSaved && (
          <div className="save-success">
            <CheckCircle size={20} />
            保存成功！数据已持久化到数据库
          </div>
        )}
      </footer>
    </div>
  );
};

export default TeamManagementPage;

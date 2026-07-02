import React, { useState, useEffect } from 'react';
import { Calendar, Edit2, Trash2, Eye, RefreshCw, AlertCircle, CheckCircle, MapPin, Plus, X } from 'lucide-react';
import { matchApi, playerApi } from '../api/service';
import { MatchDTO, PlayerDTO } from '../api/types';
import { Match, Goal, MatchEvent } from '../types';
import { generateId } from '../utils';

const MatchViewEditPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const [editData, setEditData] = useState<Match | null>(null);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<PlayerDTO[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<PlayerDTO[]>([]);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadTeamPlayers = async (homeTeamId: string, awayTeamId: string) => {
    try {
      const [homeResponse, awayResponse] = await Promise.all([
        playerApi.getAll(1, 100, homeTeamId),
        playerApi.getAll(1, 100, awayTeamId),
      ]);
      setHomeTeamPlayers(homeResponse.data);
      setAwayTeamPlayers(awayResponse.data);
    } catch (err) {
      console.error('加载球队球员失败:', err);
    }
  };

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const response = await matchApi.getAll();
      const matchList: Match[] = response.data.map((m: MatchDTO) => {
        const homeGoals = (m.goals || []).filter(g => g.teamType === 'home');
        const awayGoals = (m.goals || []).filter(g => g.teamType === 'away');
        return {
          id: m.id || generateId(),
          matchName: `${m.homeTeam?.teamName || '主队'} vs ${m.awayTeam?.teamName || '客队'}`,
          matchTime: m.matchDate,
          homeTeamName: m.homeTeam?.teamName,
          awayTeamName: m.awayTeam?.teamName,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          homeTeamGoals: homeGoals,
          awayTeamGoals: awayGoals,
          events: m.events || [],
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          location: m.location,
          status: m.status || 'finished',
          homeTeamScore: m.homeScore,
          awayTeamScore: m.awayScore,
        };
      });
      setMatches(matchList);
    } catch (err) {
      console.error('加载比赛列表失败:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        setError('请先登录系统');
      } else {
        setError('网络连接失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewMatch = (match: Match) => {
    setSelectedMatch(match);
    setIsEditing(false);
    setEditData(null);
    setError(null);
  };

  const handleEditMatch = async (match: Match) => {
    setSelectedMatch(match);
    setEditData({ ...match });
    setIsEditing(true);
    setError(null);
    setIsSaved(false);
    
    if (match.homeTeamId && match.awayTeamId) {
      await loadTeamPlayers(match.homeTeamId, match.awayTeamId);
    }
  };

  const handleEventPlayerSelect = (index: number, playerId: string) => {
    if (!editData) return;
    const event = editData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);
    
    const events = [...(editData.events || [])];
    events[index] = {
      ...events[index],
      playerId: player?.id || '',
      playerName: player?.name || '',
      jerseyNumber: player?.jerseyNumber || '',
    };
    setEditData({ ...editData, events });
  };

  const handleSubPlayerSelect = (index: number, playerId: string) => {
    if (!editData) return;
    const event = editData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);
    
    const events = [...(editData.events || [])];
    events[index] = {
      ...events[index],
      subPlayerId: player?.id || '',
      subPlayerName: player?.name || '',
      subJerseyNumber: player?.jerseyNumber || '',
    };
    setEditData({ ...editData, events });
  };

  const handleEventChange = (index: number, field: keyof MatchEvent, value: any) => {
    if (editData) {
      const events = [...(editData.events || [])];
      events[index] = { ...events[index], [field]: value } as MatchEvent;
      setEditData({ ...editData, events });
    }
  };

  const addEvent = (team: 'home' | 'away') => {
    if (editData) {
      const events = [
        ...(editData.events || []),
        {
          eventTime: '',
          eventType: 'goal',
          playerId: '',
          playerName: '',
          jerseyNumber: '',
          description: '',
          teamType: team,
        } as MatchEvent
      ];
      setEditData({ ...editData, events });
    }
  };

  const removeEvent = (index: number) => {
    if (editData) {
      const events = editData.events.filter((_, i) => i !== index);
      setEditData({ ...editData, events });
    }
  };

  const handleSaveEdit = async () => {
    if (!editData) return;

    setIsLoading(true);
    try {
      // 映射事件数据
      const events = (editData.events || []).map(e => ({
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

      await matchApi.update(editData.id, {
        homeScore: editData.homeScore,
        awayScore: editData.awayScore,
        matchDate: editData.matchTime,
        location: editData.location,
        goals: goals,
        events: events,
      });

      setIsSaved(true);
      setError(null);
      loadMatches();
      setTimeout(() => {
        setIsSaved(false);
        setIsEditing(false);
        setEditData(null);
      }, 2000);
    } catch (err) {
      console.error('更新比赛信息失败:', err);
      setError('网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('确定要删除这场比赛吗？')) return;

    setIsLoading(true);
    try {
      await matchApi.delete(matchId);
      loadMatches();
      if (selectedMatch?.id === matchId) {
        setSelectedMatch(null);
        setEditData(null);
      }
    } catch (err) {
      console.error('删除比赛失败:', err);
      setError('网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setError(null);
  };

  const handleFieldChange = (field: keyof Match, value: string | number) => {
    if (editData) {
      setEditData({ ...editData, [field]: value });
    }
  };

  const handleGoalChange = (team: 'home' | 'away', index: number, field: keyof Goal, value: string) => {
    if (editData) {
      const key = team === 'home' ? 'homeTeamGoals' : 'awayTeamGoals';
      const goals = [...editData[key]];
      goals[index] = { ...goals[index], [field]: value };
      setEditData({ ...editData, [key]: goals });
    }
  };

  const formatMatchTime = (time: string) => {
    try {
      const date = new Date(time);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return time;
    }
  };

  const getMatchStatus = (match: Match) => {
    const now = new Date();
    const matchTime = new Date(match.matchTime);
    if (matchTime > now) return { text: '未开始', color: 'warning' };
    return { text: '已结束', color: 'success' };
  };

  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Calendar className="trophy-icon" />
            比赛信息管理
          </h1>
          <p>查看和管理所有比赛信息</p>
        </div>
      </header>

      <main className="page-content">
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-section">
          <div className="section-header">
            <h2 className="form-title">
              <span className="icon">⚽</span>
              比赛列表
            </h2>
            <button onClick={loadMatches} className="add-btn refresh-btn" disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
              刷新列表
            </button>
          </div>

          {isLoading ? (
            <div className="loading-state">加载中...</div>
          ) : matches.length === 0 ? (
            <div className="empty-state">
              <Calendar size={48} />
              <p>暂无比赛数据，请先录入比赛信息</p>
            </div>
          ) : (
            <div className="player-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th>比赛名称</th>
                    <th>比赛时间</th>
                    <th>主队</th>
                    <th>客队</th>
                    <th>比分</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((match) => {
                    const status = getMatchStatus(match);
                    return (
                      <tr key={match.id} className={selectedMatch?.id === match.id ? 'selected' : ''}>
                        <td>{match.matchName}</td>
                        <td>{formatMatchTime(match.matchTime)}</td>
                        <td className="team-name-cell home">{match.homeTeamName}</td>
                        <td className="team-name-cell away">{match.awayTeamName}</td>
                        <td className="score-cell">
                          <span className="score-value home">{match.homeTeamScore}</span>
                          <span className="score-separator">:</span>
                          <span className="score-value away">{match.awayTeamScore}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${status.color}`}>{status.text}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleViewMatch(match)}
                            className="action-btn view-btn"
                            title="查看详情"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleEditMatch(match)}
                            className="action-btn edit-btn"
                            title="编辑"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMatch(match.id)}
                            className="delete-btn small"
                            title="删除"
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

        {selectedMatch && (
          <div className="form-section">
            <div className="section-header">
              <h2 className="form-title">
                <span className="icon">📋</span>
                {isEditing ? '编辑比赛信息' : `${selectedMatch.matchName} - 详细信息`}
              </h2>
              {isEditing && (
                <div className="form-actions">
                  {isSaved && (
                    <div className="save-success inline">
                      <CheckCircle size={18} />
                      保存成功
                    </div>
                  )}
                  <button onClick={handleSaveEdit} className="save-btn small" disabled={isLoading}>
                    <CheckCircle size={16} />
                    保存
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-btn">
                    取消
                  </button>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>比赛名称</label>
                {isEditing ? (
                  <select
                    value={editData?.matchName || ''}
                    onChange={(e) => handleFieldChange('matchName', e.target.value)}
                    className="form-select"
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
                ) : (
                  <div className="form-value">{selectedMatch.matchName}</div>
                )}
              </div>
              <div className="form-group">
                <label>比赛时间</label>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    value={editData?.matchTime || ''}
                    onChange={(e) => handleFieldChange('matchTime', e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{formatMatchTime(selectedMatch.matchTime)}</div>
                )}
              </div>
              <div className="form-group">
                <label>比赛地点</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.location || ''}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">
                    <MapPin size={14} style={{ marginRight: '6px' }} />
                    {selectedMatch.location || '-'}
                  </div>
                )}
              </div>
            </div>

            <div className="match-score-container">
              <div className="team-column home-team">
                <div className="team-label">主队</div>
                {isEditing ? (
                  <>
                    <div className="team-input-wrapper">
                      <input
                        type="text"
                        value={editData?.homeTeamName || ''}
                        onChange={(e) => handleFieldChange('homeTeamName', e.target.value)}
                        className="form-input team-name-input"
                        placeholder="主队名称"
                      />
                    </div>
                    <div className="team-id-wrapper">
                      <input
                        type="text"
                        value={editData?.homeTeamId || ''}
                        onChange={(e) => handleFieldChange('homeTeamId', e.target.value)}
                        className="form-input team-id-input"
                        placeholder="主队ID（可选）"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="team-name-display">{selectedMatch.homeTeamName}</div>
                    {selectedMatch.homeTeamId && (
                      <div className="team-id-display">ID: {selectedMatch.homeTeamId}</div>
                    )}
                  </>
                )}
                <div className="score-input-wrapper">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData?.homeTeamScore || 0}
                      onChange={(e) => handleFieldChange('homeTeamScore', parseInt(e.target.value) || 0)}
                      className="form-input score-input"
                      min="0"
                    />
                  ) : (
                    <div className="score-value-display">{selectedMatch.homeTeamScore}</div>
                  )}
                </div>
              </div>

              <div className="vs-divider">
                <div className="vs-circle">
                  <span className="vs-text">VS</span>
                </div>
              </div>

              <div className="team-column away-team">
                <div className="team-label">客队</div>
                {isEditing ? (
                  <>
                    <div className="team-input-wrapper">
                      <input
                        type="text"
                        value={editData?.awayTeamName || ''}
                        onChange={(e) => handleFieldChange('awayTeamName', e.target.value)}
                        className="form-input team-name-input"
                        placeholder="客队名称"
                      />
                    </div>
                    <div className="team-id-wrapper">
                      <input
                        type="text"
                        value={editData?.awayTeamId || ''}
                        onChange={(e) => handleFieldChange('awayTeamId', e.target.value)}
                        className="form-input team-id-input"
                        placeholder="客队ID（可选）"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="team-name-display">{selectedMatch.awayTeamName}</div>
                    {selectedMatch.awayTeamId && (
                      <div className="team-id-display">ID: {selectedMatch.awayTeamId}</div>
                    )}
                  </>
                )}
                <div className="score-input-wrapper">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData?.awayTeamScore || 0}
                      onChange={(e) => handleFieldChange('awayTeamScore', parseInt(e.target.value) || 0)}
                      className="form-input score-input"
                      min="0"
                    />
                  ) : (
                    <div className="score-value-display">{selectedMatch.awayTeamScore}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMatch && (isEditing || (editData?.events.filter(e => e.teamType === 'home').length || 0) > 0) && (
          <div className="form-section">
            <div className="section-header">
              <h2 className="form-title">
                <span className="icon">👕</span>
                主队事件记录（进球、换人、红黄牌）
              </h2>
              {isEditing && (
                <button
                  onClick={() => addEvent('home')}
                  className="add-btn small"
                >
                  <Plus size={14} />
                  添加主队事件
                </button>
              )}
            </div>
            <div className="player-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>时间</th>
                    <th style={{ width: '150px' }}>事件类型</th>
                    <th style={{ width: '220px' }}>球员</th>
                    <th style={{ width: '120px' }}>号码</th>
                    <th>事件描述</th>
                    {isEditing && <th style={{ width: '60px' }}>操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {(editData?.events.filter(e => e.teamType === 'home').length || 0) > 0 ? (
                    editData?.events.map((event, index) => {
                      if (event.teamType !== 'home') return null;
                      return (
                        <tr key={index}>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={event.eventTime || ''}
                                onChange={(e) => handleEventChange(index, 'eventTime', e.target.value)}
                                className="form-input inline"
                                placeholder="如: 35'"
                                required
                            />
                          ) : (
                            <span>{event.eventTime}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              value={event.eventType}
                              onChange={(e) => handleEventChange(index, 'eventType', e.target.value as any)}
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
                          ) : (
                            <span>
                              {event.eventType === 'goal' && '⚽ 普通进球'}
                              {event.eventType === 'penalty' && '🎯 点球'}
                              {event.eventType === 'own_goal' && '🥅 乌龙球'}
                              {event.eventType === 'substitution' && '🔄 换人'}
                              {event.eventType === 'yellow_card' && '🟨 黄牌'}
                              {event.eventType === 'red_card' && '🟥 红牌'}
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            event.eventType === 'substitution' ? (
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
                                      换上: {player.name}
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
                                      换下: {player.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <select
                                value={event.playerId || ''}
                                onChange={(e) => handleEventPlayerSelect(index, e.target.value)}
                                className="form-select inline"
                                required
                              >
                                <option value="">请选择球员</option>
                                {homeTeamPlayers.map((player) => (
                                  <option key={player.id} value={player.id}>
                                    {player.name}
                                  </option>
                                ))}
                              </select>
                            )
                          ) : (
                            event.eventType === 'substitution' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                                <span>换上: {event.playerName}</span>
                                <span>换下: {event.subPlayerName}</span>
                              </div>
                            ) : (
                              <span>{event.playerName}</span>
                            )
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
                          {isEditing ? (
                            <input
                              type="text"
                              value={event.description || ''}
                              onChange={(e) => handleEventChange(index, 'description', e.target.value)}
                              className="form-input inline"
                              placeholder={event.eventType === 'substitution' ? "选填，自动生成换人描述" : "选填，自动生成事件描述"}
                            />
                          ) : (
                            <span>{event.description || '-'}</span>
                          )}
                        </td>
                        {isEditing && (
                          <td>
                            <button
                              onClick={() => removeEvent(index)}
                              className="delete-btn small"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                  ) : isEditing ? (
                    <tr>
                      <td colSpan={6} className="empty-state-cell">
                        暂无主队事件记录，点击上方"添加主队事件"按钮添加
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty-state-cell">
                        暂无主队事件记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedMatch && (isEditing || (editData?.events.filter(e => e.teamType === 'away').length || 0) > 0) && (
          <div className="form-section">
            <div className="section-header">
              <h2 className="form-title">
                <span className="icon">👚</span>
                客队事件记录（进球、换人、红黄牌）
              </h2>
              {isEditing && (
                <button
                  onClick={() => addEvent('away')}
                  className="add-btn small"
                >
                  <Plus size={14} />
                  添加客队事件
                </button>
              )}
            </div>
            <div className="player-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>时间</th>
                    <th style={{ width: '150px' }}>事件类型</th>
                    <th style={{ width: '220px' }}>球员</th>
                    <th style={{ width: '120px' }}>号码</th>
                    <th>事件描述</th>
                    {isEditing && <th style={{ width: '60px' }}>操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {(editData?.events.filter(e => e.teamType === 'away').length || 0) > 0 ? (
                    editData?.events.map((event, index) => {
                      if (event.teamType !== 'away') return null;
                      return (
                        <tr key={index}>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                value={event.eventTime || ''}
                                onChange={(e) => handleEventChange(index, 'eventTime', e.target.value)}
                                className="form-input inline"
                                placeholder="如: 35'"
                                required
                            />
                          ) : (
                            <span>{event.eventTime}</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <select
                              value={event.eventType}
                              onChange={(e) => handleEventChange(index, 'eventType', e.target.value as any)}
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
                          ) : (
                            <span>
                              {event.eventType === 'goal' && '⚽ 普通进球'}
                              {event.eventType === 'penalty' && '🎯 点球'}
                              {event.eventType === 'own_goal' && '🥅 乌龙球'}
                              {event.eventType === 'substitution' && '🔄 换人'}
                              {event.eventType === 'yellow_card' && '🟨 黄牌'}
                              {event.eventType === 'red_card' && '🟥 红牌'}
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            event.eventType === 'substitution' ? (
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
                                      换上: {player.name}
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
                                      换下: {player.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <select
                                value={event.playerId || ''}
                                onChange={(e) => handleEventPlayerSelect(index, e.target.value)}
                                className="form-select inline"
                                required
                              >
                                <option value="">请选择球员</option>
                                {awayTeamPlayers.map((player) => (
                                  <option key={player.id} value={player.id}>
                                    {player.name}
                                  </option>
                                ))}
                              </select>
                            )
                          ) : (
                            event.eventType === 'substitution' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                                <span>换上: {event.playerName}</span>
                                <span>换下: {event.subPlayerName}</span>
                              </div>
                            ) : (
                              <span>{event.playerName}</span>
                            )
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
                          {isEditing ? (
                            <input
                              type="text"
                              value={event.description || ''}
                              onChange={(e) => handleEventChange(index, 'description', e.target.value)}
                              className="form-input inline"
                              placeholder={event.eventType === 'substitution' ? "选填，自动生成换人描述" : "选填，自动生成事件描述"}
                            />
                          ) : (
                            <span>{event.description || '-'}</span>
                          )}
                        </td>
                        {isEditing && (
                          <td>
                            <button
                              onClick={() => removeEvent(index)}
                              className="delete-btn small"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                  ) : isEditing ? (
                    <tr>
                      <td colSpan={6} className="empty-state-cell">
                        暂无客队事件记录，点击上方"添加客队事件"按钮添加
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty-state-cell">
                        暂无客队事件记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedMatch && (
          <div className="form-section empty-detail-section">
            <div className="empty-state">
              <Calendar size={48} />
              <p>请选择一场比赛查看详情</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MatchViewEditPage;
import React, { useState, useEffect } from 'react';
import { Calendar, Edit2, Trash2, Eye, RefreshCw, AlertCircle, CheckCircle, MapPin, Plus, X } from 'lucide-react';
import { matchApi, playerApi } from '../api/service';
import { MatchDTO, PlayerDTO } from '../api/types';
import { Match, Goal } from '../types';
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
      const matchList: Match[] = response.data.map((m: MatchDTO) => ({
        id: m.id || generateId(),
        matchName: `${m.homeTeam?.teamName || '主队'} vs ${m.awayTeam?.teamName || '客队'}`,
        matchTime: m.matchDate,
        homeTeamName: m.homeTeam?.teamName,
        awayTeamName: m.awayTeam?.teamName,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        homeTeamGoals: [],
        awayTeamGoals: [],
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        location: m.location,
        status: m.status || 'finished',
        homeTeamScore: m.homeScore,
        awayTeamScore: m.awayScore,
      }));
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

  const handlePlayerSelect = (team: 'home' | 'away', index: number, playerId: string) => {
    if (!editData) return;
    
    const players = team === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);
    const key = team === 'home' ? 'homeTeamGoals' : 'awayTeamGoals';
    
    const goals = [...editData[key]];
    goals[index] = {
      ...goals[index],
      playerName: player?.name || '',
      jerseyNumber: player?.jerseyNumber || '',
    };
    setEditData({ ...editData, [key]: goals });
  };

  const addGoal = (team: 'home' | 'away') => {
    if (!editData) return;
    
    const key = team === 'home' ? 'homeTeamGoals' : 'awayTeamGoals';
    const goals = [...editData[key], { playerName: '', jerseyNumber: '', goalTime: '' }];
    setEditData({ ...editData, [key]: goals });
  };

  const removeGoal = (team: 'home' | 'away', index: number) => {
    if (!editData) return;
    
    const key = team === 'home' ? 'homeTeamGoals' : 'awayTeamGoals';
    const goals = editData[key].filter((_, i) => i !== index);
    setEditData({ ...editData, [key]: goals });
  };

  const handleSaveEdit = async () => {
    if (!editData) return;

    setIsLoading(true);
    try {
      await matchApi.update(editData.id, {
        homeScore: editData.homeScore,
        awayScore: editData.awayScore,
        matchDate: editData.matchTime,
        location: editData.location,
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

        {selectedMatch && (isEditing || (editData?.homeTeamGoals.length || 0) > 0) && (
          <div className="form-section">
            <div className="section-header">
              <h2 className="form-title">
                <span className="icon">👕</span>
                主队进球记录
              </h2>
              {isEditing && (
                <button
                  onClick={() => addGoal('home')}
                  className="add-btn small"
                >
                  <Plus size={14} />
                  添加进球
                </button>
              )}
            </div>
            <div className="player-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th>进球球员</th>
                    <th>球衣号码</th>
                    <th>进球时间</th>
                    {isEditing && <th>操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {(editData?.homeTeamGoals.length || 0) > 0 ? (
                    editData?.homeTeamGoals.map((goal, index) => (
                      <tr key={index}>
                        <td>
                          {isEditing ? (
                            <select
                              value={homeTeamPlayers.find(p => p.name === goal.playerName)?.id || ''}
                              onChange={(e) => handlePlayerSelect('home', index, e.target.value)}
                              className="form-select inline"
                            >
                              <option value="">请选择球员</option>
                              {homeTeamPlayers.map((player) => (
                                <option key={player.id} value={player.id}>
                                  {player.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>{goal.playerName}</span>
                          )}
                        </td>
                        <td>
                          <div className="form-value inline">
                            {goal.jerseyNumber || '-'}
                          </div>
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={goal.goalTime || ''}
                              onChange={(e) => handleGoalChange('home', index, 'goalTime', e.target.value)}
                              className="form-input inline"
                              placeholder="如: 第30分钟"
                            />
                          ) : (
                            <span>{goal.goalTime}</span>
                          )}
                        </td>
                        {isEditing && (
                          <td>
                            <button
                              onClick={() => removeGoal('home', index)}
                              className="delete-btn small"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : isEditing ? (
                    <tr>
                      <td colSpan={isEditing ? 4 : 3} className="empty-state-cell">
                        暂无进球记录，点击上方"添加进球"按钮添加
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedMatch && (isEditing || (editData?.awayTeamGoals.length || 0) > 0) && (
          <div className="form-section">
            <div className="section-header">
              <h2 className="form-title">
                <span className="icon">👚</span>
                客队进球记录
              </h2>
              {isEditing && (
                <button
                  onClick={() => addGoal('away')}
                  className="add-btn small"
                >
                  <Plus size={14} />
                  添加进球
                </button>
              )}
            </div>
            <div className="player-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th>进球球员</th>
                    <th>球衣号码</th>
                    <th>进球时间</th>
                    {isEditing && <th>操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {(editData?.awayTeamGoals.length || 0) > 0 ? (
                    editData?.awayTeamGoals.map((goal, index) => (
                      <tr key={index}>
                        <td>
                          {isEditing ? (
                            <select
                              value={awayTeamPlayers.find(p => p.name === goal.playerName)?.id || ''}
                              onChange={(e) => handlePlayerSelect('away', index, e.target.value)}
                              className="form-select inline"
                            >
                              <option value="">请选择球员</option>
                              {awayTeamPlayers.map((player) => (
                                <option key={player.id} value={player.id}>
                                  {player.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span>{goal.playerName}</span>
                          )}
                        </td>
                        <td>
                          <div className="form-value inline">
                            {goal.jerseyNumber || '-'}
                          </div>
                        </td>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={goal.goalTime || ''}
                              onChange={(e) => handleGoalChange('away', index, 'goalTime', e.target.value)}
                              className="form-input inline"
                              placeholder="如: 第30分钟"
                            />
                          ) : (
                            <span>{goal.goalTime}</span>
                          )}
                        </td>
                        {isEditing && (
                          <td>
                            <button
                              onClick={() => removeGoal('away', index)}
                              className="delete-btn small"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : isEditing ? (
                    <tr>
                      <td colSpan={isEditing ? 4 : 3} className="empty-state-cell">
                        暂无进球记录，点击上方"添加进球"按钮添加
                      </td>
                    </tr>
                  ) : null}
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
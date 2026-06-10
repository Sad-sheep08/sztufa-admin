import React, { useState, useEffect } from 'react';
import { Calendar, Edit2, Trash2, Eye, RefreshCw, AlertCircle, CheckCircle, MapPin } from 'lucide-react';
import { matchApi } from '../api/service';
import { MatchDTO, GoalDTO } from '../api/types';
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

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const response = await matchApi.getAll();
      if (response.success) {
        const matchList: Match[] = response.data.matches.map((m: MatchDTO) => ({
          id: m.id || generateId(),
          matchName: m.matchName,
          matchTime: m.matchTime,
          homeTeamName: m.homeTeamName,
          awayTeamName: m.awayTeamName,
          homeTeamScore: m.homeTeamScore,
          awayTeamScore: m.awayTeamScore,
          homeTeamGoals: m.homeTeamGoals.map((g) => ({
            playerName: g.playerName,
            goalTime: g.goalTime,
            jerseyNumber: g.jerseyNumber,
          })),
          awayTeamGoals: m.awayTeamGoals.map((g) => ({
            playerName: g.playerName,
            goalTime: g.goalTime,
            jerseyNumber: g.jerseyNumber,
          })),
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          location: m.location,
          status: 'completed',
        }));
        setMatches(matchList);
      } else {
        setError(response.message || '加载比赛列表失败');
      }
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

  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match);
    setEditData({ ...match });
    setIsEditing(true);
    setError(null);
    setIsSaved(false);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;

    setIsLoading(true);
    try {
      const homeGoalsDTO: GoalDTO[] = editData.homeTeamGoals.map((g) => ({
        playerName: g.playerName,
        goalTime: g.goalTime,
        jerseyNumber: g.jerseyNumber,
      }));

      const awayGoalsDTO: GoalDTO[] = editData.awayTeamGoals.map((g) => ({
        playerName: g.playerName,
        goalTime: g.goalTime,
        jerseyNumber: g.jerseyNumber,
      }));

      const response = await matchApi.update(editData.id, {
        matchName: editData.matchName,
        matchTime: editData.matchTime,
        homeTeamName: editData.homeTeamName,
        awayTeamName: editData.awayTeamName,
        homeTeamScore: editData.homeTeamScore,
        awayTeamScore: editData.awayTeamScore,
        homeTeamGoals: homeGoalsDTO,
        awayTeamGoals: awayGoalsDTO,
        homeTeamId: editData.homeTeamId || undefined,
        awayTeamId: editData.awayTeamId || undefined,
        location: editData.location || undefined,
      });

      if (response.success) {
        setIsSaved(true);
        setError(null);
        loadMatches();
        setTimeout(() => {
          setIsSaved(false);
          setIsEditing(false);
          setEditData(null);
        }, 2000);
      } else {
        setError(response.message || '更新失败');
      }
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
      const response = await matchApi.delete(matchId);
      if (response.success) {
        loadMatches();
        if (selectedMatch?.id === matchId) {
          setSelectedMatch(null);
          setEditData(null);
        }
      } else {
        setError(response.message || '删除失败');
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
    <div className="match-view-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Calendar className="trophy-icon" />
            比赛信息查看与编辑
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

        <div className="matches-container">
          <div className="matches-list">
            <div className="list-header">
              <h2>比赛列表</h2>
              <button onClick={loadMatches} className="refresh-btn" disabled={isLoading}>
                <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
                刷新
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
              <table className="matches-table">
                <thead>
                  <tr>
                    <th>比赛名称</th>
                    <th>比赛时间</th>
                    <th>对阵双方</th>
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
                        <td>
                          <span className="team-name home">{match.homeTeamName}</span>
                          <span className="vs">VS</span>
                          <span className="team-name away">{match.awayTeamName}</span>
                        </td>
                        <td className="score">
                          <span className="home-score">{match.homeTeamScore}</span>
                          <span className="score-divider">:</span>
                          <span className="away-score">{match.awayTeamScore}</span>
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
                            className="action-btn delete-btn"
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
            )}
          </div>

          <div className="match-detail">
            {selectedMatch ? (
              <>
                <div className="detail-header">
                  <h2>{isEditing ? '编辑比赛信息' : `${selectedMatch.matchName} - 详细信息`}</h2>
                  {isEditing && (
                    <>
                      {isSaved && (
                        <div className="save-success inline">
                          <CheckCircle size={18} />
                          保存成功
                        </div>
                      )}
                      <div className="detail-actions">
                        <button onClick={handleSaveEdit} className="save-btn small" disabled={isLoading}>
                          <CheckCircle size={16} />
                          保存
                        </button>
                        <button onClick={handleCancelEdit} className="cancel-btn">
                          取消
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="detail-content">
                  <div className="detail-section">
                    <h3>基本信息</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
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
                          <span>{selectedMatch.matchName}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>比赛时间</label>
                        {isEditing ? (
                          <input
                            type="datetime-local"
                            value={editData?.matchTime || ''}
                            onChange={(e) => handleFieldChange('matchTime', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{formatMatchTime(selectedMatch.matchTime)}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>比赛地点</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.location || ''}
                            onChange={(e) => handleFieldChange('location', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span className="location-text">
                            <MapPin size={14} />
                            {selectedMatch.location || '-'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>对阵球队</h3>
                    <div className="match-teams-display">
                      <div className="team-box home">
                        <div className="team-label">主队</div>
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editData?.homeTeamName || ''}
                              onChange={(e) => handleFieldChange('homeTeamName', e.target.value)}
                              className="form-input"
                              placeholder="主队名称"
                            />
                            <input
                              type="text"
                              value={editData?.homeTeamId || ''}
                              onChange={(e) => handleFieldChange('homeTeamId', e.target.value)}
                              className="form-input small"
                              placeholder="主队ID（可选）"
                            />
                          </>
                        ) : (
                          <>
                            <div className="team-name">{selectedMatch.homeTeamName}</div>
                            {selectedMatch.homeTeamId && (
                              <div className="team-id">ID: {selectedMatch.homeTeamId}</div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="vs-display">VS</div>

                      <div className="team-box away">
                        <div className="team-label">客队</div>
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editData?.awayTeamName || ''}
                              onChange={(e) => handleFieldChange('awayTeamName', e.target.value)}
                              className="form-input"
                              placeholder="客队名称"
                            />
                            <input
                              type="text"
                              value={editData?.awayTeamId || ''}
                              onChange={(e) => handleFieldChange('awayTeamId', e.target.value)}
                              className="form-input small"
                              placeholder="客队ID（可选）"
                            />
                          </>
                        ) : (
                          <>
                            <div className="team-name">{selectedMatch.awayTeamName}</div>
                            {selectedMatch.awayTeamId && (
                              <div className="team-id">ID: {selectedMatch.awayTeamId}</div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>比赛结果</h3>
                    <div className="score-display">
                      <div className="score-box home">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData?.homeTeamScore || 0}
                            onChange={(e) => handleFieldChange('homeTeamScore', parseInt(e.target.value) || 0)}
                            className="score-input"
                            min="0"
                          />
                        ) : (
                          <span className="score-value">{selectedMatch.homeTeamScore}</span>
                        )}
                        <span className="score-label">主队得分</span>
                      </div>
                      <div className="score-separator">:</div>
                      <div className="score-box away">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editData?.awayTeamScore || 0}
                            onChange={(e) => handleFieldChange('awayTeamScore', parseInt(e.target.value) || 0)}
                            className="score-input"
                            min="0"
                          />
                        ) : (
                          <span className="score-value">{selectedMatch.awayTeamScore}</span>
                        )}
                        <span className="score-label">客队得分</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>主队进球记录</h3>
                    {selectedMatch.homeTeamGoals.length === 0 ? (
                      <div className="empty-state small">
                        <p>暂无进球记录</p>
                      </div>
                    ) : (
                      <table className="goals-table">
                        <thead>
                          <tr>
                            <th>进球球员</th>
                            <th>球衣号码</th>
                            <th>进球时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMatch.homeTeamGoals.map((goal, index) => (
                            <tr key={index}>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editData?.homeTeamGoals[index]?.playerName || ''}
                                    onChange={(e) => handleGoalChange('home', index, 'playerName', e.target.value)}
                                    className="form-input small"
                                  />
                                ) : (
                                  <span>{goal.playerName}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editData?.homeTeamGoals[index]?.jerseyNumber || ''}
                                    onChange={(e) => handleGoalChange('home', index, 'jerseyNumber', e.target.value)}
                                    className="form-input small"
                                  />
                                ) : (
                                  <span>{goal.jerseyNumber}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editData?.homeTeamGoals[index]?.goalTime || ''}
                                    onChange={(e) => handleGoalChange('home', index, 'goalTime', e.target.value)}
                                    className="form-input small"
                                  />
                                ) : (
                                  <span>{goal.goalTime}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="detail-section">
                    <h3>客队进球记录</h3>
                    {selectedMatch.awayTeamGoals.length === 0 ? (
                      <div className="empty-state small">
                        <p>暂无进球记录</p>
                      </div>
                    ) : (
                      <table className="goals-table">
                        <thead>
                          <tr>
                            <th>进球球员</th>
                            <th>球衣号码</th>
                            <th>进球时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMatch.awayTeamGoals.map((goal, index) => (
                            <tr key={index}>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editData?.awayTeamGoals[index]?.playerName || ''}
                                    onChange={(e) => handleGoalChange('away', index, 'playerName', e.target.value)}
                                    className="form-input small"
                                  />
                                ) : (
                                  <span>{goal.playerName}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editData?.awayTeamGoals[index]?.jerseyNumber || ''}
                                    onChange={(e) => handleGoalChange('away', index, 'jerseyNumber', e.target.value)}
                                    className="form-input small"
                                  />
                                ) : (
                                  <span>{goal.jerseyNumber}</span>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editData?.awayTeamGoals[index]?.goalTime || ''}
                                    onChange={(e) => handleGoalChange('away', index, 'goalTime', e.target.value)}
                                    className="form-input small"
                                  />
                                ) : (
                                  <span>{goal.goalTime}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-detail">
                <Calendar size={48} />
                <p>请选择一场比赛查看详情</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MatchViewEditPage;
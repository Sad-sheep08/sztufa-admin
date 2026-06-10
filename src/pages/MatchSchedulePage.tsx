import React, { useState, useEffect } from 'react';
import { Users, Edit2, Trash2, Eye, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { teamApi } from '../api/service';
import { TeamDTO } from '../api/types';
import { Team } from '../types';
import { generateId } from '../utils';

const TeamViewEditPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const [editData, setEditData] = useState<Team | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const response = await teamApi.getAll();
      if (response.success) {
        const teamList: Team[] = response.data.teams.map((t: TeamDTO) => ({
          id: t.id || generateId(),
          teamName: t.teamName,
          teamDoctor: t.teamDoctor,
          headCoach: t.headCoach,
          teamLeader: t.teamLeader,
          coachPhone: t.coachPhone,
          leaderPhone: t.leaderPhone,
          homeJerseyColor: t.homeJerseyColor,
          awayJerseyColor: t.awayJerseyColor,
          teamLogo: t.teamLogo || null,
          homeJersey: t.homeJersey || null,
          awayJersey: t.awayJersey || null,
          players: t.players.map((p) => ({
            id: p.id || generateId(),
            name: p.name,
            studentId: p.studentId,
            jerseyNumber: p.jerseyNumber,
            photo: p.photo || null,
          })),
          league: t.league,
          foundedDate: t.foundedDate,
          homeStadium: t.homeStadium,
          homeCity: t.homeCity,
        }));
        setTeams(teamList);
      } else {
        setError(response.message || '加载球队列表失败');
      }
    } catch (err) {
      console.error('加载球队列表失败:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        setError('请先登录系统');
      } else {
        setError('网络连接失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsEditing(false);
    setEditData(null);
    setError(null);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setEditData({ ...team });
    setIsEditing(true);
    setError(null);
    setIsSaved(false);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;

    setIsLoading(true);
    try {
      const response = await teamApi.update(editData.id, {
        teamName: editData.teamName,
        teamDoctor: editData.teamDoctor,
        headCoach: editData.headCoach,
        teamLeader: editData.teamLeader,
        coachPhone: editData.coachPhone,
        leaderPhone: editData.leaderPhone,
        homeJerseyColor: editData.homeJerseyColor,
        awayJerseyColor: editData.awayJerseyColor,
        league: editData.league || undefined,
        foundedDate: editData.foundedDate || undefined,
        homeStadium: editData.homeStadium || undefined,
        homeCity: editData.homeCity || undefined,
      });

      if (response.success) {
        setIsSaved(true);
        setError(null);
        loadTeams();
        setTimeout(() => {
          setIsSaved(false);
          setIsEditing(false);
          setEditData(null);
        }, 2000);
      } else {
        setError(response.message || '更新失败');
      }
    } catch (err) {
      console.error('更新球队信息失败:', err);
      setError('网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('确定要删除这支球队吗？')) return;

    setIsLoading(true);
    try {
      const response = await teamApi.delete(teamId);
      if (response.success) {
        loadTeams();
        if (selectedTeam?.id === teamId) {
          setSelectedTeam(null);
          setEditData(null);
        }
      } else {
        setError(response.message || '删除失败');
      }
    } catch (err) {
      console.error('删除球队失败:', err);
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

  const handleFieldChange = (field: keyof Team, value: string) => {
    if (editData) {
      setEditData({ ...editData, [field]: value });
    }
  };

  return (
    <div className="team-view-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Users className="trophy-icon" />
            球队信息查看与编辑
          </h1>
          <p>查看和管理所有球队信息</p>
        </div>
      </header>

      <main className="page-content">
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="teams-container">
          <div className="teams-list">
            <div className="list-header">
              <h2>球队列表</h2>
              <button onClick={loadTeams} className="refresh-btn" disabled={isLoading}>
                <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
                刷新
              </button>
            </div>

            {isLoading ? (
              <div className="loading-state">加载中...</div>
            ) : teams.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <p>暂无球队数据，请先录入球队信息</p>
              </div>
            ) : (
              <table className="teams-table">
                <thead>
                  <tr>
                    <th>球队名称</th>
                    <th>主教练</th>
                    <th>所属联赛</th>
                    <th>主场城市</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id} className={selectedTeam?.id === team.id ? 'selected' : ''}>
                      <td>{team.teamName}</td>
                      <td>{team.headCoach}</td>
                      <td>{team.league || '-'}</td>
                      <td>{team.homeCity || '-'}</td>
                      <td>
                        <button
                          onClick={() => handleViewTeam(team)}
                          className="action-btn view-btn"
                          title="查看详情"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="action-btn edit-btn"
                          title="编辑"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="action-btn delete-btn"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="team-detail">
            {selectedTeam ? (
              <>
                <div className="detail-header">
                  <h2>{isEditing ? '编辑球队信息' : `${selectedTeam.teamName} - 详细信息`}</h2>
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
                        <label>球队名称</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.teamName || ''}
                            onChange={(e) => handleFieldChange('teamName', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.teamName}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>所属联赛</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.league || ''}
                            onChange={(e) => handleFieldChange('league', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.league || '-'}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>成立时间</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editData?.foundedDate || ''}
                            onChange={(e) => handleFieldChange('foundedDate', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.foundedDate || '-'}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>主场城市</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.homeCity || ''}
                            onChange={(e) => handleFieldChange('homeCity', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.homeCity || '-'}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>主场场馆</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.homeStadium || ''}
                            onChange={(e) => handleFieldChange('homeStadium', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.homeStadium || '-'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>管理人员</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>主教练</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.headCoach || ''}
                            onChange={(e) => handleFieldChange('headCoach', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.headCoach}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>主教练电话</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.coachPhone || ''}
                            onChange={(e) => handleFieldChange('coachPhone', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.coachPhone}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>领队</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.teamLeader || ''}
                            onChange={(e) => handleFieldChange('teamLeader', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.teamLeader}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>领队电话</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.leaderPhone || ''}
                            onChange={(e) => handleFieldChange('leaderPhone', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.leaderPhone}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>队医</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.teamDoctor || ''}
                            onChange={(e) => handleFieldChange('teamDoctor', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.teamDoctor}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>球衣信息</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>主场球衣颜色</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.homeJerseyColor || ''}
                            onChange={(e) => handleFieldChange('homeJerseyColor', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.homeJerseyColor}</span>
                        )}
                      </div>
                      <div className="detail-item">
                        <label>客场球衣颜色</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData?.awayJerseyColor || ''}
                            onChange={(e) => handleFieldChange('awayJerseyColor', e.target.value)}
                            className="form-input"
                          />
                        ) : (
                          <span>{selectedTeam.awayJerseyColor}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>球员名单 ({selectedTeam.players.length}人)</h3>
                    {selectedTeam.players.length === 0 ? (
                      <div className="empty-state small">
                        <p>暂无球员数据</p>
                      </div>
                    ) : (
                      <table className="players-table">
                        <thead>
                          <tr>
                            <th>姓名</th>
                            <th>学号</th>
                            <th>球衣号码</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedTeam.players.map((player) => (
                            <tr key={player.id}>
                              <td>{player.name}</td>
                              <td>{player.studentId}</td>
                              <td>{player.jerseyNumber}</td>
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
                <Users size={48} />
                <p>请选择一支球队查看详情</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamViewEditPage;
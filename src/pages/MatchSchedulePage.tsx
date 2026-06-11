import React, { useState, useEffect } from 'react';
import { Users, Edit2, Trash2, Eye, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { teamApi } from '../api/service';
import { TeamDTO, PlayerDTO } from '../api/types';
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
      const teamList: Team[] = response.data.map((t: TeamDTO) => ({
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
        players: t.players?.map((p: PlayerDTO) => ({
          id: p.id || generateId(),
          name: p.name,
          studentId: p.studentId,
          jerseyNumber: p.jerseyNumber,
          photo: p.photo || null,
          teamId: p.teamId || '',
        })) || [],
      }));
      setTeams(teamList);
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
      const editTeamDTO = {
        teamName: editData.teamName,
        teamDoctor: editData.teamDoctor,
        headCoach: editData.headCoach,
        teamLeader: editData.teamLeader,
        coachPhone: editData.coachPhone,
        leaderPhone: editData.leaderPhone,
        homeJerseyColor: editData.homeJerseyColor,
        awayJerseyColor: editData.awayJerseyColor,
      };

      await teamApi.update(editData.id, editTeamDTO);
      setIsSaved(true);
      setError(null);
      loadTeams();
      setTimeout(() => {
        setIsSaved(false);
        setIsEditing(false);
        setEditData(null);
      }, 2000);
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
      await teamApi.delete(teamId);
      loadTeams();
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(null);
        setEditData(null);
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
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Users className="trophy-icon" />
            球队信息管理
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

        <div className="form-section">
          <div className="section-header">
            <h2 className="form-title">
              <span className="icon">🏆</span>
              球队列表
            </h2>
            <button onClick={loadTeams} className="add-btn refresh-btn" disabled={isLoading}>
              <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
              刷新列表
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
            <div className="player-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th>球队名称</th>
                    <th>主教练</th>
                    <th>领队</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id} className={selectedTeam?.id === team.id ? 'selected' : ''}>
                      <td>{team.teamName}</td>
                      <td>{team.headCoach}</td>
                      <td>{team.teamLeader}</td>
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
                          className="delete-btn small"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedTeam && (
          <div className="form-section">
            <div className="section-header">
              <h2 className="form-title">
                <span className="icon">📋</span>
                {isEditing ? '编辑球队信息' : `${selectedTeam.teamName} - 详细信息`}
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
                <label>球队名称</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.teamName || ''}
                    onChange={(e) => handleFieldChange('teamName', e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{selectedTeam.teamName}</div>
                )}
              </div>
              <div className="form-group">
                <label>主教练</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.headCoach || ''}
                    onChange={(e) => handleFieldChange('headCoach', e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{selectedTeam.headCoach}</div>
                )}
              </div>
              <div className="form-group">
                <label>主教练电话</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.coachPhone || ''}
                    onChange={(e) => handleFieldChange('coachPhone', e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{selectedTeam.coachPhone}</div>
                )}
              </div>
              <div className="form-group">
                <label>领队</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.teamLeader || ''}
                    onChange={(e) => handleFieldChange('teamLeader', e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{selectedTeam.teamLeader}</div>
                )}
              </div>
              <div className="form-group">
                <label>领队电话</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.leaderPhone || ''}
                    onChange={(e) => handleFieldChange('leaderPhone', e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{selectedTeam.leaderPhone}</div>
                )}
              </div>
              <div className="form-group">
                <label>队医</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.teamDoctor || ''}
                    onChange={(e) => handleFieldChange('teamDoctor', e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{selectedTeam.teamDoctor}</div>
                )}
              </div>
              <div className="form-group">
                <label>主场球衣颜色</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.homeJerseyColor || ''}
                    onChange={(e) => handleFieldChange('homeJerseyColor', e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{selectedTeam.homeJerseyColor}</div>
                )}
              </div>
              <div className="form-group">
                <label>客场球衣颜色</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData?.awayJerseyColor || ''}
                    onChange={(e) => handleFieldChange('awayJerseyColor', e.target.value)}
                    className="form-input"
                  />
                ) : (
                  <div className="form-value">{selectedTeam.awayJerseyColor}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {selectedTeam && selectedTeam.players && selectedTeam.players.length > 0 && (
          <div className="form-section">
            <h2 className="form-title">
              <span className="icon">👥</span>
              球员名单 ({selectedTeam.players.length}人)
            </h2>
            <div className="player-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>学号</th>
                    <th>球衣号码</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTeam.players?.map((player) => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td>{player.studentId}</td>
                      <td>{player.jerseyNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!selectedTeam && (
          <div className="form-section empty-detail-section">
            <div className="empty-state">
              <Users size={48} />
              <p>请选择一支球队查看详情</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeamViewEditPage;
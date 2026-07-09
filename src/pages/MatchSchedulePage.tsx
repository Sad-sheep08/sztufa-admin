import React, { useState, useEffect } from 'react';
import { Users, Edit2, Trash2, Eye, RefreshCw, AlertCircle, CheckCircle, Plus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelImporter from '../components/ExcelImporter';
import { teamApi, playerApi, matchApi } from '../api/service';
import { TeamDTO, PlayerDTO } from '../api/types';
import { Team, Player } from '../types';
import { generateId } from '../utils';
import { useAuth } from '../contexts/AuthContext';

const TeamViewEditPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const [editData, setEditData] = useState<Team | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [allMatches, setAllMatches] = useState<any[]>([]);

  useEffect(() => {
    loadTeams();
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await matchApi.getAll(1, 100);
      setAllMatches(response.data || []);
    } catch (err) {
      console.error('加载比赛记录失败:', err);
    }
  };

  const getTeamStats = (teamId: string) => {
    // 找出所有与该球队相关的已结束比赛，按时间升序（从旧到新）
    const teamMatches = allMatches
      .filter(m => (m.homeTeamId === teamId || m.awayTeamId === teamId) && m.status === 'finished')
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

    // 零封场次统计
    let cleanSheets = 0;
    teamMatches.forEach(m => {
      if (m.homeTeamId === teamId && m.awayScore === 0) {
        cleanSheets++;
      } else if (m.awayTeamId === teamId && m.homeScore === 0) {
        cleanSheets++;
      }
    });

    // 最近5场战绩走势 (W/D/L)
    const recentMatches = teamMatches.slice(-5);
    const form = recentMatches.map(m => {
      const isHome = m.homeTeamId === teamId;
      const teamScore = isHome ? m.homeScore : m.awayScore;
      const opponentScore = isHome ? m.awayScore : m.homeScore;

      if (teamScore > opponentScore) return 'W'; // 胜
      if (teamScore === opponentScore) return 'D'; // 平
      return 'L'; // 负
    });

    return { cleanSheets, form };
  };

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
          status: p.status || 'active',
          yellowCards: p.yellowCards || 0,
          redCards: p.redCards || 0,
          teamId: p.teamId || '',
        })) || [],
      }));
      if (user && user.role === 'coach') {
        const coachTeamId = user.teamId;
        const filteredTeams = teamList.filter(t => t.id === coachTeamId);
        setTeams(filteredTeams);
        if (filteredTeams.length > 0) {
          setSelectedTeam(filteredTeams[0]);
        }
      } else {
        setTeams(teamList);
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
    setEditData({
      ...team,
      players: team.players ? team.players.map((p) => ({ ...p })) : [],
    });
    setIsEditing(true);
    setError(null);
    setIsSaved(false);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;

    // 校验球员名单格式是否完整
    if (editData.players) {
      for (let i = 0; i < editData.players.length; i++) {
        const p = editData.players[i];
        if (!p.name.trim()) {
          setError(`第 ${i + 1} 个球员的姓名不能为空`);
          return;
        }
        if (!p.studentId.trim()) {
          setError(`第 ${i + 1} 个球员的学号不能为空`);
          return;
        }
        if (!p.jerseyNumber.trim()) {
          setError(`第 ${i + 1} 个球员的球衣号码不能为空`);
          return;
        }
      }
    }

    setIsLoading(true);
    setError(null);
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

      // 1. 保存球队基本信息
      await teamApi.update(editData.id, editTeamDTO);

      // 2. 比对并同步球员信息
      const originalPlayers = selectedTeam?.players || [];
      const currentPlayers = editData.players || [];

      // 2a. 删除已移除的球员
      const playersToDelete = originalPlayers.filter(
        op => !currentPlayers.some(cp => cp.id === op.id)
      );
      for (const p of playersToDelete) {
        await playerApi.delete(p.id);
      }

      // 2b. 新建或更新现存球员
      for (const p of currentPlayers) {
        const original = originalPlayers.find(op => op.id === p.id);
        if (!original) {
          // 新增球员 (ID由后端生成，不传ID)
          const playerDTO = {
            name: p.name,
            studentId: p.studentId,
            jerseyNumber: p.jerseyNumber,
            status: p.status || 'active',
            yellowCards: Number(p.yellowCards) || 0,
            redCards: Number(p.redCards) || 0,
            teamId: editData.id,
          };
          await playerApi.create(playerDTO);
        } else if (
          original.name !== p.name ||
          original.studentId !== p.studentId ||
          original.jerseyNumber !== p.jerseyNumber ||
          original.status !== p.status ||
          Number(original.yellowCards) !== Number(p.yellowCards) ||
          Number(original.redCards) !== Number(p.redCards)
        ) {
          // 更新球员信息
          const playerDTO = {
            name: p.name,
            studentId: p.studentId,
            jerseyNumber: p.jerseyNumber,
            status: p.status || 'active',
            yellowCards: Number(p.yellowCards) || 0,
            redCards: Number(p.redCards) || 0,
            teamId: editData.id,
          };
          await playerApi.update(p.id, playerDTO);
        }
      }

      setIsSaved(true);
      setError(null);
      
      // 更新当前选中的球队状态，防止再次点击时读取旧状态
      const updatedPlayersResponse = await playerApi.getAll(1, 100, editData.id);
      const updatedTeam = {
        ...editData,
        players: updatedPlayersResponse.data.map((p: PlayerDTO) => ({
          id: p.id || generateId(),
          name: p.name,
          studentId: p.studentId,
          jerseyNumber: p.jerseyNumber,
          photo: p.photo || null,
          status: p.status || 'active',
          yellowCards: p.yellowCards || 0,
          redCards: p.redCards || 0,
          teamId: p.teamId || '',
        })),
      };
      setSelectedTeam(updatedTeam);

      loadTeams();
      setTimeout(() => {
        setIsSaved(false);
        setIsEditing(false);
        setEditData(null);
      }, 2000);
    } catch (err) {
      console.error('更新系统信息失败:', err);
      setError('更新失败，网络连接错误或学号已被占用');
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

  const handlePlayerFieldChange = (index: number, field: keyof Player, value: any) => {
    if (editData) {
      const players = [...(editData.players || [])];
      players[index] = { ...players[index], [field]: value } as Player;
      setEditData({ ...editData, players });
    }
  };

  const handleDeletePlayerRow = (index: number) => {
    if (editData) {
      const players = (editData.players || []).filter((_, i) => i !== index);
      setEditData({ ...editData, players });
    }
  };

  const handleAddPlayerRow = () => {
    if (editData) {
      const newPlayer: Player = {
        id: `temp_${Date.now()}`,
        name: '',
        studentId: '',
        jerseyNumber: '',
        photo: null,
        teamId: editData.id,
      };
      setEditData({ ...editData, players: [...(editData.players || []), newPlayer] });
    }
  };

  const handleExcelImport = (importedPlayers: Omit<Player, 'id'>[]) => {
    if (editData) {
      const newPlayers = importedPlayers.map((p) => ({
        ...p,
        id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        teamId: editData.id,
      }));
      setEditData({ ...editData, players: [...(editData.players || []), ...newPlayers] });
      setShowImporter(false);
    }
  };

  const handleExportPlayers = () => {
    if (!selectedTeam) return;
    const exportData = (selectedTeam.players || []).map((p) => ({
      '姓名': p.name,
      '学号': p.studentId,
      '球衣号码': p.jerseyNumber,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '球员名单');
    XLSX.writeFile(workbook, `${selectedTeam.teamName}_球员名单.xlsx`);
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
                        {(user?.role === 'super_admin' || (user?.role === 'coach' && user?.teamId === team.id)) && (
                          <button
                            onClick={() => handleEditTeam(team)}
                            className="action-btn edit-btn"
                            title="编辑"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {user?.role === 'super_admin' && (
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="delete-btn small"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
                    disabled={user?.role !== 'super_admin'}
                    title={user?.role !== 'super_admin' ? '仅超级管理员可修改球队名称' : ''}
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
              
              {!isEditing && (
                <div className="form-group" style={{ gridColumn: 'span 3', marginTop: '10px' }}>
                  <label>赛季数据与战绩走势</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '8px' }}>
                    <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', color: '#495057' }}>
                      零封场次: <strong style={{ color: '#2b8a3e', fontSize: '16px' }}>{getTeamStats(selectedTeam.id).cleanSheets}</strong> 场
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: '#495057' }}>最近战绩:</span>
                      {getTeamStats(selectedTeam.id).form.length === 0 ? (
                        <span style={{ fontSize: '13px', color: '#868e96', fontStyle: 'italic' }}>暂无已结束比赛</span>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {getTeamStats(selectedTeam.id).form.map((result, idx) => {
                            let color = '#868e96'; // D (Gray)
                            let label = '平';
                            if (result === 'W') { color = '#2b8a3e'; label = '胜'; }
                            else if (result === 'L') { color = '#fa5252'; label = '负'; }
                            return (
                              <span 
                                key={idx} 
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  width: '24px', 
                                  height: '24px', 
                                  borderRadius: '50%', 
                                  background: color, 
                                  color: '#fff', 
                                  fontSize: '11px', 
                                  fontWeight: 'bold',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                title={result === 'W' ? '胜利' : result === 'L' ? '失败' : '平局'}
                              >
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTeam && (isEditing || (selectedTeam.players && selectedTeam.players.length > 0)) && (
          <div className="form-section">
            <div className="section-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="form-title" style={{ margin: 0 }}>
                <span className="icon">👥</span>
                球员名单 ({isEditing ? (editData?.players?.length || 0) : (selectedTeam.players?.length || 0)}人)
              </h2>
              {!isEditing && (
                <button onClick={handleExportPlayers} className="add-btn small refresh-btn" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
                  <Download size={14} />
                  导出名单
                </button>
              )}
            </div>
            <div className="player-table-wrapper">
              <table className="player-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>学号</th>
                    <th>球衣号码</th>
                    <th>黄牌数</th>
                    <th>红牌数</th>
                    <th>可用状态</th>
                    {isEditing && <th>操作</th>}
                  </tr>
                </thead>
                <tbody>
                  {isEditing ? (
                    editData?.players?.map((player, index) => (
                      <tr key={player.id || index} style={player.status === 'suspended' ? { background: '#fff5f5' } : undefined}>
                        <td>
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) => handlePlayerFieldChange(index, 'name', e.target.value)}
                            className="form-input"
                            placeholder="姓名"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={player.studentId}
                            onChange={(e) => handlePlayerFieldChange(index, 'studentId', e.target.value)}
                            className="form-input"
                            placeholder="学号"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={player.jerseyNumber}
                            onChange={(e) => handlePlayerFieldChange(index, 'jerseyNumber', e.target.value)}
                            className="form-input"
                            placeholder="号码"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={player.yellowCards || 0}
                            onChange={(e) => handlePlayerFieldChange(index, 'yellowCards', parseInt(e.target.value) || 0)}
                            className="form-input"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '70px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            value={player.redCards || 0}
                            onChange={(e) => handlePlayerFieldChange(index, 'redCards', parseInt(e.target.value) || 0)}
                            className="form-input"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '70px' }}
                          />
                        </td>
                        <td>
                          <select
                            value={player.status || 'active'}
                            onChange={(e) => handlePlayerFieldChange(index, 'status', e.target.value)}
                            className="form-input"
                            style={{ margin: 0, padding: '4px 8px', fontSize: '14px', height: '32px', width: '100px' }}
                          >
                            <option value="active">🟢 可用</option>
                            <option value="suspended">🔴 停赛</option>
                          </select>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeletePlayerRow(index)}
                            className="delete-btn small"
                            title="删除"
                            style={{ padding: '6px 10px', height: '32px' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    (selectedTeam.players || []).map((player) => (
                      <tr key={player.id} style={player.status === 'suspended' ? { background: '#fff5f5' } : undefined}>
                        <td style={{ fontWeight: player.status === 'suspended' ? 600 : undefined }}>
                          {player.name}
                          {player.status === 'suspended' && (
                            <span style={{ marginLeft: '8px', color: '#fa5252', fontSize: '11px', fontWeight: 'normal', background: '#ffe3e3', padding: '2px 6px', borderRadius: '4px' }}>
                              🛑 停赛
                            </span>
                          )}
                        </td>
                        <td>{player.studentId}</td>
                        <td>{player.jerseyNumber}</td>
                        <td>🟨 {player.yellowCards || 0}</td>
                        <td>🟥 {player.redCards || 0}</td>
                        <td>
                          {player.status === 'suspended' ? (
                            <span style={{ color: '#fa5252', fontWeight: 600 }}>停赛中</span>
                          ) : (
                            <span style={{ color: '#2b8a3e' }}>可用</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {isEditing && (
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button onClick={handleAddPlayerRow} className="add-btn small" style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
                  <Plus size={14} />
                  添加单个球员
                </button>
                <button 
                  onClick={() => setShowImporter(!showImporter)} 
                  className="add-btn small refresh-btn" 
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}
                >
                  <Users size={14} />
                  {showImporter ? '隐藏批量导入' : 'Excel 批量追加'}
                </button>
              </div>
            )}

            {isEditing && showImporter && (
              <div style={{ marginTop: '20px', padding: '20px', border: '1px dashed #ddd', borderRadius: '8px', background: '#fcfcfc' }}>
                <ExcelImporter onImport={handleExcelImport} />
              </div>
            )}
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
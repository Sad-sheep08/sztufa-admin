import React, { useState, useEffect } from 'react';
import { Database, Download, RotateCcw, AlertTriangle, FileCheck, RefreshCw, Calendar, Users, ShieldAlert, Plus, Trash2, CheckCircle2, Key } from 'lucide-react';
import { backupApi, seasonApi, userApi, teamApi, authApi } from '../api/service';
import { BackupDTO, TeamDTO } from '../api/types';

const SystemSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'backup' | 'groups' | 'users'>('backup');
  const [backups, setBackups] = useState<BackupDTO[]>([]);
  const [activeSeason, setActiveSeason] = useState<any>(null);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonType, setNewSeasonType] = useState('LEAGUE');
  const [isArchivingSeason, setIsArchivingSeason] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 用户与权限管理的状态
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userEdits, setUserEdits] = useState<Record<string, { role: string; teamId: string | null }>>({});

  // 注册新用户的表单状态
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newTeamId, setNewTeamId] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  const [seasons, setSeasons] = useState<any[]>([]);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
    loadActiveSeason();
    loadAllSeasons();
    loadTeams();
  }, []);

  const loadAllSeasons = async () => {
    try {
      const data = await seasonApi.getAll();
      setSeasons(data || []);
    } catch (err) {
      console.error('加载所有赛季失败:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadTeams = async () => {
    try {
      const res = await teamApi.getAll();
      setTeams(res.data || []);
    } catch (err) {
      console.error('加载球队列表失败:', err);
    }
  };

  const loadUsers = async () => {
    setIsUsersLoading(true);
    setUserError(null);
    try {
      const data = await userApi.getAll();
      setUsers(data || []);
      setUserEdits({});
    } catch (err) {
      console.error('加载用户列表失败:', err);
      setUserError('获取用户列表失败，请检查网络或登录状态');
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleRoleChangeInRow = (userId: string, currentRole: string, currentTeamId: string | null, newRole: string) => {
    const prevEdit = userEdits[userId] || { role: currentRole, teamId: currentTeamId };
    setUserEdits({
      ...userEdits,
      [userId]: {
        ...prevEdit,
        role: newRole,
        teamId: newRole === 'coach' ? prevEdit.teamId || teams[0]?.id || null : null,
      }
    });
  };

  const handleTeamChangeInRow = (userId: string, currentRole: string, currentTeamId: string | null, newTeamId: string | null) => {
    const prevEdit = userEdits[userId] || { role: currentRole, teamId: currentTeamId };
    setUserEdits({
      ...userEdits,
      [userId]: {
        ...prevEdit,
        teamId: newTeamId,
      }
    });
  };

  const handleUpdateUserRole = async (userId: string, role: string, teamId: string | null) => {
    setUserError(null);
    setUserSuccess(null);
    try {
      await userApi.updateRole(userId, role, teamId);
      setUserSuccess('成功更新用户权限！');
      
      // 清理该行的编辑状态
      const newEdits = { ...userEdits };
      delete newEdits[userId];
      setUserEdits(newEdits);
      
      loadUsers();
      setTimeout(() => setUserSuccess(null), 3000);
    } catch (err) {
      console.error('修改权限失败:', err);
      setUserError(err instanceof Error ? err.message : '更新用户权限失败');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`【警告】确定要永久删除用户账号“${username}”吗？此操作无法恢复！`)) {
      return;
    }
    setUserError(null);
    setUserSuccess(null);
    try {
      await userApi.delete(userId);
      setUserSuccess('用户账号已删除');
      loadUsers();
      setTimeout(() => setUserSuccess(null), 3000);
    } catch (err) {
      console.error('删除用户失败:', err);
      setUserError(err instanceof Error ? err.message : '删除用户失败');
    }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    const newPass = prompt(`请输入为用户“${username}”设置的新密码（最少6个字符）：`);
    if (newPass === null) return; // 用户取消
    const trimmedPass = newPass.trim();
    if (trimmedPass.length < 6) {
      alert('重置密码失败：密码长度不能少于6个字符！');
      return;
    }
    setUserError(null);
    setUserSuccess(null);
    try {
      await userApi.resetPassword(userId, trimmedPass);
      setUserSuccess(`已成功将用户“${username}”的密码重置为您输入的新密码！`);
      setTimeout(() => setUserSuccess(null), 3000);
    } catch (err) {
      console.error('重置密码失败:', err);
      setUserError(err instanceof Error ? err.message : '重置密码失败');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setUserError('用户名和密码不能为空');
      return;
    }
    setIsCreatingUser(true);
    setUserError(null);
    setUserSuccess(null);
    try {
      await authApi.register({
        username: newUsername,
        password: newPassword,
        role: newRole,
        teamId: newRole === 'coach' && newTeamId ? newTeamId : undefined,
      });
      setUserSuccess(`新账号“${newUsername}”创建成功！`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setNewTeamId('');
      loadUsers();
      setTimeout(() => setUserSuccess(null), 4000);
    } catch (err) {
      console.error('创建用户失败:', err);
      setUserError(err instanceof Error ? err.message : '创建用户失败，可能用户名已存在');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const loadBackups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await backupApi.list();
      if (response.success) {
        setBackups(response.data || []);
      }
    } catch (err) {
      console.error('加载备份列表失败:', err);
      setError('无法获取云端备份列表，请检查网络或 R2 连接');
    } finally {
      setIsLoading(false);
    }
  };

  const [groupsData, setGroupsData] = useState<{ teamId: string; groupName: string }[]>([]);
  const [isSavingGroups, setIsSavingGroups] = useState(false);

  const loadSeasonGroups = async (seasonId: string) => {
    try {
      const data = await seasonApi.getGroups(seasonId);
      const initialMap = (data || []).map((g: any) => ({
        teamId: g.teamId,
        groupName: g.groupName
      }));
      setGroupsData(initialMap);
    } catch (err) {
      console.error('加载分组失败:', err);
    }
  };

  const loadActiveSeason = async () => {
    try {
      const data = await seasonApi.getActive();
      setActiveSeason(data);
      if (data && data.type === 'CUP') {
        loadSeasonGroups(data.id);
      }
    } catch (err) {
      console.error('加载活跃赛季失败:', err);
    }
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonName.trim()) return;

    if (!confirm(`确定要创建新赛季“${newSeasonName}”并将其直接设为活跃状态吗？\n\n此操作会重置球员的卡片数，但不会强行归档现有的其他活跃赛季。`)) {
      return;
    }

    setIsArchivingSeason(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await seasonApi.create(newSeasonName, newSeasonType);
      setSuccessMessage(`已成功创建新活跃赛季：${res.name}`);
      setNewSeasonName('');
      loadActiveSeason();
      loadAllSeasons();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('创建新赛季失败:', err);
      setError(err instanceof Error ? err.message : '创建新赛季失败');
    } finally {
      setIsArchivingSeason(false);
    }
  };

  const handleUpdateSeasonStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'archived' : 'active';
    if (!confirm(`确定要将该赛季的状态修改为【${nextStatus === 'active' ? '活跃' : '已归档'}】吗？`)) {
      return;
    }

    setIsUpdatingStatusId(id);
    setError(null);
    setSuccessMessage(null);
    try {
      await seasonApi.updateStatus(id, nextStatus);
      setSuccessMessage('已成功更新赛季状态！');
      loadActiveSeason();
      loadAllSeasons();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('更新赛季状态失败:', err);
      setError(err instanceof Error ? err.message : '更新赛季状态失败');
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  const handleTeamGroupChange = (teamId: string, groupName: string) => {
    setGroupsData(prev => {
      const filtered = prev.filter(g => g.teamId !== teamId);
      if (groupName) {
        return [...filtered, { teamId, groupName }];
      }
      return filtered;
    });
  };

  const handleSaveGroups = async () => {
    if (!activeSeason) return;
    setIsSavingGroups(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await seasonApi.updateGroups(activeSeason.id, groupsData);
      setSuccessMessage('小组分配已成功保存并重新计算了积分榜！');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('保存分组失败:', err);
      setError(err instanceof Error ? err.message : '保存分组失败');
    } finally {
      setIsSavingGroups(false);
    }
  };

  const handleGenerateKnockout = async () => {
    if (!activeSeason) return;
    if (!confirm('【确认】确定要根据当前的小组赛积分榜一键生成淘汰赛对阵吗？\n如果已存在对应的淘汰赛比赛，队伍信息将会被更新覆盖。确定执行吗？')) {
      return;
    }
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await seasonApi.generateKnockout(activeSeason.id);
      setSuccessMessage(`淘汰赛对阵生成成功！已生成首轮淘汰赛轮次: ${res.round}，新建了 ${res.countCreated} 场，更新了 ${res.countUpdated} 场比赛。请到比赛信息管理页面查看对阵结果。`);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err) {
      console.error('一键生成淘汰赛失败:', err);
      setError(err instanceof Error ? err.message : '一键生成淘汰赛失败，请先确认小组赛比分已录入且系统已计算出积分榜');
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await backupApi.create();
      if (response.success) {
        setSuccessMessage('数据库成功备份并上传至 Cloudflare R2！');
        loadBackups();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('创建备份失败:', err);
      setError('创建备份失败，请检查 R2 存储桶配置');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (key: string) => {
    if (!confirm('【警告】还原数据库将会删除并完全覆盖当前数据库中的所有球队、球员、赛程、进球和事件记录！此操作不可逆！\n\n确定要还原到选中的备份吗？')) {
      return;
    }

    setIsRestoring(key);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await backupApi.restore(key);
      if (response.success) {
        setSuccessMessage('数据库已成功恢复至指定备份状态！');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('还原备份失败:', err);
      setError('还原失败，备份文件可能损坏或网络连接中断');
    } finally {
      setIsRestoring(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="team-info-page">
      <style>{`
        .season-card {
          background: #fff;
          border: 1px solid #e9ecef;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        .season-form {
          display: flex;
          gap: 15px;
          align-items: flex-end;
        }
        .season-input-field {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
          height: 40px;
          background: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .season-input-field:focus {
          border-color: #3b5bdb;
          box-shadow: 0 0 0 3px rgba(59,91,219,0.1);
          outline: none;
        }
        .season-table-wrapper {
          overflow-x: auto;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .season-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          text-align: left;
        }
        .season-table th {
          padding: 12px 16px;
          font-weight: 600;
          color: #495057;
          background: #f8f9fa;
          border-bottom: 2px solid #dee2e6;
        }
        .season-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #e9ecef;
          vertical-align: middle;
        }
        .season-table tr:last-child td {
          border-bottom: none;
        }
        .season-table tr:hover {
          background-color: #f8f9fa;
        }
        
        @media (max-width: 768px) {
          .season-card {
            padding: 16px;
          }
          .season-form {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .season-form > div {
            width: 100% !important;
          }
          .season-form button {
            width: 100%;
            justify-content: center;
            margin-top: 5px;
          }
        }
      `}</style>
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Database className="trophy-icon" />
            系统设置与安全中心
          </h1>
          <p>管理全站赛季归档重置、灾备数据备份，以及后台管理员与各学院教练的精细化权限分配</p>
        </div>
      </header>

      <main className="page-content">
        {/* 页签导航 */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('backup')}
            style={{
              padding: '8px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === 'backup' ? '#0070f3' : '#666',
              background: activeTab === 'backup' ? '#f0f7ff' : 'none',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Database size={16} />
            📂 数据灾备与归档
          </button>
          {activeSeason?.type === 'CUP' && (
            <button
              onClick={() => setActiveTab('groups')}
              style={{
                padding: '8px 18px',
                fontSize: '14px',
                fontWeight: 600,
                color: activeTab === 'groups' ? '#0070f3' : '#666',
                background: activeTab === 'groups' ? '#f0f7ff' : 'none',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Users size={16} />
              🏆 赛季分组配置
            </button>
          )}
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '8px 18px',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === 'users' ? '#0070f3' : '#666',
              background: activeTab === 'users' ? '#f0f7ff' : 'none',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Users size={16} />
            👥 用户权限管理
          </button>
        </div>

        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="save-success" style={{ display: 'flex', marginBottom: '20px' }}>
            <FileCheck size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {userError && (
          <div className="error-message">
            <span>{userError}</span>
          </div>
        )}

        {userSuccess && (
          <div className="save-success" style={{ display: 'flex', marginBottom: '20px' }}>
            <CheckCircle2 size={20} style={{ color: '#2b8a3e' }} />
            <span>{userSuccess}</span>
          </div>
        )}

        {/* 页签 1: 数据灾备与归档 */}
        {activeTab === 'backup' && (
          <>
            {/* 赛季重置与归档管理 */}
            <div className="form-section" style={{ marginBottom: '30px' }}>
              <div className="section-header" style={{ marginBottom: '20px' }}>
                <h2 className="form-title" style={{ margin: 0 }}>
                  <span className="icon">⚡</span>
                  创建新赛季
                </h2>
              </div>
              <div className="season-card">
                <form onSubmit={handleCreateSeason} className="season-form">
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '8px' }}>
                      新赛季名称：
                    </label>
                    <input
                      type="text"
                      placeholder="例如：2026秋季杯赛"
                      value={newSeasonName}
                      onChange={(e) => setNewSeasonName(e.target.value)}
                      disabled={isArchivingSeason}
                      className="season-input-field"
                    />
                  </div>
                  <div style={{ width: '220px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#495057', marginBottom: '8px' }}>
                      赛制类型：
                    </label>
                    <select
                      value={newSeasonType}
                      onChange={(e) => setNewSeasonType(e.target.value)}
                      disabled={isArchivingSeason}
                      className="season-input-field"
                    >
                      <option value="LEAGUE">单循环联赛 (League)</option>
                      <option value="CUP">杯赛 (Cup - 小组+淘汰赛)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isArchivingSeason || !newSeasonName.trim()}
                    className="save-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', height: '40px', margin: 0 }}
                  >
                    {isArchivingSeason ? (
                      <>
                        <RefreshCw size={18} className="spinning" />
                        正在创建中...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        创建新赛季
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            <div className="form-section" style={{ marginBottom: '30px' }}>
              <div className="section-header" style={{ marginBottom: '20px' }}>
                <h2 className="form-title" style={{ margin: 0 }}>
                  <span className="icon">📅</span>
                  赛季状态管理
                </h2>
              </div>
              <div className="season-card">
                <div className="season-table-wrapper">
                  <table className="season-table">
                    <thead>
                      <tr>
                        <th>赛季名称</th>
                        <th>类型</th>
                        <th>状态</th>
                        <th style={{ textAlign: 'center', width: '150px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasons.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: '500', color: '#333' }}>{s.name}</td>
                          <td style={{ color: '#666' }}>
                            {s.type === 'CUP' ? (
                              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>🏆 杯赛</span>
                            ) : (
                              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>⚽ 联赛</span>
                            )}
                          </td>
                          <td>
                            {s.status === 'active' ? (
                              <span style={{ background: '#e6fffa', color: '#00a389', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #b2f5ea' }}>活跃中</span>
                            ) : (
                              <span style={{ background: '#f7fafc', color: '#718096', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e2e8f0' }}>已归档</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => handleUpdateSeasonStatus(s.id, s.status)}
                              disabled={isUpdatingStatusId === s.id}
                              className="add-btn small"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 12px',
                                height: 'auto',
                                cursor: 'pointer',
                                background: s.status === 'active' ? '#fff0f0' : '#00a389',
                                color: s.status === 'active' ? '#d93838' : '#ffffff',
                                borderColor: s.status === 'active' ? '#ffd1d1' : '#00a389',
                                borderStyle: 'solid',
                                borderWidth: '1px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}
                            >
                              {isUpdatingStatusId === s.id ? (
                                <>
                                  <RefreshCw size={12} className="spinning" />
                                  处理中...
                                </>
                              ) : s.status === 'active' ? (
                                <>归档赛季</>
                              ) : (
                                <>重新激活</>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {seasons.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>暂无赛季数据</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header" style={{ marginBottom: '20px' }}>
                <h2 className="form-title" style={{ margin: 0 }}>
                  <span className="icon">💾</span>
                  立即触发系统备份
                </h2>
              </div>
              <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ maxWidth: '70%' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>手动执行全站备份</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                    点击后系统将立即导出当前的所有数据表（包含球队、球员、战绩及系统日志），对其进行压缩，然后生成 `.json` 文件并安全推送到 R2 云端。
                  </p>
                </div>
                <button
                  onClick={handleCreateBackup}
                  disabled={isBackingUp || isRestoring !== null}
                  className="save-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', height: 'auto', margin: 0 }}
                >
                  {isBackingUp ? (
                    <>
                      <RefreshCw size={18} className="spinning" />
                      正在备份中...
                    </>
                  ) : (
                    <>
                      <Database size={18} />
                      立即执行备份
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '30px' }}>
              <div className="section-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="form-title" style={{ margin: 0 }}>
                  <span className="icon">☁️</span>
                  R2 云端历史备份记录 ({backups.length}个备份)
                </h2>
                <button onClick={loadBackups} className="add-btn refresh-btn" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
                  <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
                  刷新列表
                </button>
              </div>

              {isLoading ? (
                <div className="loading-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>加载列表中...</div>
              ) : backups.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>
                  <Database size={48} style={{ marginBottom: '10px', color: '#ccc' }} />
                  <p>暂无任何云端备份记录，请点击上方按钮创建首个备份</p>
                </div>
              ) : (
                <div className="player-table-wrapper">
                  <table className="player-table">
                    <thead>
                      <tr>
                        <th>备份文件名</th>
                        <th>文件大小</th>
                        <th>创建时间</th>
                        <th style={{ width: '220px', textAlign: 'center' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((bk) => (
                        <tr key={bk.key}>
                          <td style={{ fontWeight: 500, color: '#333' }}>{bk.filename}</td>
                          <td style={{ color: '#666' }}>{formatSize(bk.size)}</td>
                          <td style={{ color: '#666' }}>{formatDate(bk.lastModified)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <a
                                href={bk.downloadUrl}
                                download
                                className="add-btn small btn-secondary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', padding: '5px 10px', height: 'auto' }}
                              >
                                <Download size={12} />
                                下载
                              </a>
                              <button
                                onClick={() => handleRestore(bk.key)}
                                disabled={isRestoring !== null || isBackingUp}
                                className="add-btn small refresh-btn"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '5px 10px', height: 'auto', background: '#ffebeb', color: '#d93838', borderColor: '#ffd1d1' }}
                              >
                                {isRestoring === bk.key ? (
                                  <>
                                    <RefreshCw size={12} className="spinning" />
                                    还原中...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw size={12} />
                                    覆盖还原
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="form-section alert-section" style={{ marginTop: '30px', border: '1px solid #ffe3b3', background: '#fffcf5', padding: '20px', borderRadius: '8px', display: 'flex', gap: '15px' }}>
              <AlertTriangle size={36} style={{ color: '#e69500', flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#b37400' }}>安全操作守则</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#665c40', lineHeight: '1.5' }}>
                  <li><strong>备份范围</strong>：备份文件仅包含数据库内容，并不包含图片文件本身（图片将安全保留在 Cloudflare R2 云存储上，不被删除）。</li>
                  <li><strong>还原警告</strong>：点击“覆盖还原”将清空本地或 Neon 线上当前的所有赛程比分、球队数据，并完全用备份文件里的老数据覆盖。进行此操作前，建议先创建一个最新的备份！</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* 页签: 赛季分组配置 */}
        {activeTab === 'groups' && activeSeason?.type === 'CUP' && (
          <div className="form-section">
            <div className="section-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="form-title" style={{ margin: 0 }}>
                <span className="icon">🏆</span>
                本赛季分组配置 ({activeSeason.name})
              </h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleGenerateKnockout}
                  className="save-btn"
                  style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 16px', margin: 0, cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ⚡ 一键生成淘汰赛对阵
                </button>
                <button
                  onClick={handleSaveGroups}
                  disabled={isSavingGroups}
                  className="save-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 16px', margin: 0 }}
                >
                  {isSavingGroups ? '正在保存...' : '💾 保存分组配置'}
                </button>
              </div>
            </div>

            <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
                请为本届杯赛赛季的各个参赛球队划分小组。点击右上角“保存分组配置”生效。
                <br />
                <strong>提示：</strong>当小组赛比赛全部录入完赛后，可点击左侧“⚡ 一键生成淘汰赛对阵”按钮，系统将自动按积分规则计算出线名次并生成首轮淘汰赛对阵（支持 2组、4组、8组 系统交叉对决）。
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                {teams.map(team => {
                  const currentGroup = groupsData.find(g => g.teamId === team.id)?.groupName || '';
                  return (
                    <div
                      key={team.id}
                      style={{
                        padding: '12px 15px',
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {team.teamLogo ? (
                          <img src={team.teamLogo} alt={team.teamName} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚽</div>
                        )}
                        <span style={{ fontWeight: '500', color: '#333' }}>{team.teamName}</span>
                      </div>
                      <select
                        value={currentGroup}
                        onChange={(e) => handleTeamGroupChange(team.id!, e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', fontSize: '14px' }}
                      >
                        <option value="">-- 未分配 --</option>
                        <option value="A">A 组</option>
                        <option value="B">B 组</option>
                        <option value="C">C 组</option>
                        <option value="D">D 组</option>
                        <option value="E">E 组</option>
                        <option value="F">F 组</option>
                        <option value="G">G 组</option>
                        <option value="H">H 组</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 页签 2: 用户权限管理 */}
        {activeTab === 'users' && (
          <>
            {/* 新账号创建 */}
            <div className="form-section" style={{ marginBottom: '30px' }}>
              <div className="section-header" style={{ marginBottom: '20px' }}>
                <h2 className="form-title" style={{ margin: 0 }}>
                  <span className="icon">➕</span>
                  创建后台新用户账号
                </h2>
              </div>
              <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                <form onSubmit={handleCreateUser} className="create-user-form" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#555', marginBottom: '8px' }}>用户名</label>
                    <input
                      type="text"
                      placeholder="账号用户名"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      disabled={isCreatingUser}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#555', marginBottom: '8px' }}>密码</label>
                    <input
                      type="password"
                      placeholder="至少6个字符"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isCreatingUser}
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ width: '150px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#555', marginBottom: '8px' }}>角色权限</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      disabled={isCreatingUser}
                      className="form-select"
                      style={{ width: '100%', padding: '8px 12px', height: '37px', margin: 0 }}
                    >
                      <option value="user">普通用户 (只读)</option>
                      <option value="match_scorer">赛事记录员</option>
                      <option value="coach">球队教练/领队</option>
                      <option value="super_admin">超级管理员</option>
                    </select>
                  </div>
                  {newRole === 'coach' && (
                    <div style={{ width: '200px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#555', marginBottom: '8px' }}>所辖球队</label>
                      <select
                        value={newTeamId}
                        onChange={(e) => setNewTeamId(e.target.value)}
                        disabled={isCreatingUser}
                        className="form-select"
                        style={{ width: '100%', padding: '8px 12px', height: '37px', margin: 0 }}
                        required
                      >
                        <option value="">请选择绑定球队</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.teamName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isCreatingUser}
                    className="save-btn"
                    style={{ padding: '8px 20px', height: '37px', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} />
                    确认创建
                  </button>
                </form>
              </div>
            </div>

            {/* 用户管理列表 */}
            <div className="form-section" style={{ marginTop: '30px' }}>
              <div className="section-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="form-title" style={{ margin: 0 }}>
                  <span className="icon">👥</span>
                  系统后台用户权限清单 ({users.length}人)
                </h2>
                <button onClick={loadUsers} className="add-btn refresh-btn" disabled={isUsersLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
                  <RefreshCw size={14} className={isUsersLoading ? 'spinning' : ''} />
                  刷新列表
                </button>
              </div>

              {isUsersLoading ? (
                <div className="loading-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>加载用户列表中...</div>
              ) : users.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center', color: '#666' }}>
                  <Users size={48} style={{ marginBottom: '10px', color: '#ccc' }} />
                  <p>暂无任何后台用户记录</p>
                </div>
              ) : (
                <div className="player-table-wrapper">
                  <table className="player-table users-input-table">
                    <thead>
                      <tr>
                        <th>用户名</th>
                        <th style={{ width: '180px' }}>角色权限</th>
                        <th style={{ width: '220px' }}>绑定所辖球队 (限教练)</th>
                        <th>注册时间</th>
                        <th style={{ width: '180px', textAlign: 'center' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const edit = userEdits[u.id];
                        const activeRole = edit ? edit.role : u.role;
                        const activeTeamId = edit ? edit.teamId : (u.teamId || null);
                        const hasChanges = !!edit;

                        return (
                          <tr key={u.id}>
                            <td data-label="用户名" style={{ fontWeight: 500, color: '#333' }}>
                              {u.username}
                              {u.username === 'admin' && (
                                <span style={{ background: '#fff3cd', color: '#856404', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', marginLeft: '8px' }}>
                                  主超管
                                </span>
                              )}
                            </td>
                            <td data-label="角色权限">
                              <select
                                value={activeRole}
                                onChange={(e) => handleRoleChangeInRow(u.id, u.role, u.teamId, e.target.value)}
                                disabled={u.username === 'admin'}
                                className="form-select inline"
                                style={{ margin: 0, padding: '4px 8px', height: '32px', fontSize: '13px' }}
                              >
                                <option value="user">普通用户 (只读)</option>
                                <option value="match_scorer">赛事记录员</option>
                                <option value="coach">球队教练/领队</option>
                                <option value="super_admin">超级管理员</option>
                              </select>
                            </td>
                            <td data-label="绑定球队">
                              {activeRole === 'coach' ? (
                                <select
                                  value={activeTeamId || ''}
                                  onChange={(e) => handleTeamChangeInRow(u.id, u.role, u.teamId, e.target.value || null)}
                                  className="form-select inline"
                                  style={{ margin: 0, padding: '4px 8px', height: '32px', fontSize: '13px' }}
                                  required
                                >
                                  <option value="">未绑定任何球队</option>
                                  {teams.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.teamName}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span style={{ color: '#aaa', fontSize: '13px' }}>--</span>
                              )}
                            </td>
                            <td data-label="注册时间" style={{ color: '#666' }}>{formatDate(u.createdAt)}</td>
                            <td data-label="操作">
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleUpdateUserRole(u.id, activeRole, activeTeamId)}
                                  disabled={!hasChanges}
                                  className="add-btn small"
                                  style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', height: 'auto', margin: 0 }}
                                >
                                  保存
                                </button>
                                <button
                                  onClick={() => handleResetPassword(u.id, u.username)}
                                  className="add-btn small"
                                  style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', height: 'auto', margin: 0, backgroundColor: '#f0ad4e', borderColor: '#eea236', color: '#fff' }}
                                >
                                  <Key size={12} style={{ marginRight: '3px' }} />
                                  重置
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  disabled={u.username === 'admin'}
                                  className="delete-btn small"
                                  style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', height: 'auto', margin: 0 }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SystemSettingsPage;

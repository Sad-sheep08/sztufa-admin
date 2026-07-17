import React, { useState, useEffect } from 'react';
import { Database, FileCheck, CheckCircle2 } from 'lucide-react';
import { backupApi, seasonApi, userApi, teamApi, authApi } from '../../api/service';
import { BackupDTO, TeamDTO } from '../../api/types';
import { SeasonBackupPanel, CupGroupPanel, UserManagementPanel } from './components';

const SystemSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'backup' | 'groups' | 'users'>('backup');

  // 备份与赛季相关状态
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
  const [seasons, setSeasons] = useState<any[]>([]);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);

  // 分组相关状态
  const [groupsData, setGroupsData] = useState<{ teamId: string; groupName: string }[]>([]);
  const [isSavingGroups, setIsSavingGroups] = useState(false);

  // 用户与权限管理的状态
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userEdits, setUserEdits] = useState<Record<string, { role: string; teamId: string | null }>>({});
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newTeamId, setNewTeamId] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
    loadActiveSeason();
    loadAllSeasons();
    loadTeams();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  // ─── 数据加载 ──────────────────────────────────────────────────────────────

  const loadAllSeasons = async () => {
    try {
      const data = await seasonApi.getAll();
      setSeasons(data || []);
    } catch (err) {
      console.error('加载所有赛季失败:', err);
    }
  };

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

  // ─── 赛季处理 ──────────────────────────────────────────────────────────────

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonName.trim()) return;
    if (!confirm(`确定要创建新赛季"${newSeasonName}"并将其直接设为活跃状态吗？\n\n此操作会重置球员的卡片数，但不会强行归档现有的其他活跃赛季。`)) return;

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
    if (!confirm(`确定要将该赛季的状态修改为【${nextStatus === 'active' ? '活跃' : '已归档'}】吗？`)) return;

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

  // ─── 分组处理 ──────────────────────────────────────────────────────────────

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
    if (!confirm('【确认】确定要根据当前的小组赛积分榜一键生成淘汰赛对阵吗？\n如果已存在对应的淘汰赛比赛，队伍信息将会被更新覆盖。确定执行吗？')) return;

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

  // ─── 备份处理 ──────────────────────────────────────────────────────────────

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
    if (!confirm('【警告】还原数据库将会删除并完全覆盖当前数据库中的所有球队、球员、赛程、进球和事件记录！此操作不可逆！\n\n确定要还原到选中的备份吗？')) return;

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

  // ─── 用户处理 ──────────────────────────────────────────────────────────────

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
    if (!confirm(`【警告】确定要永久删除用户账号"${username}"吗？此操作无法恢复！`)) return;
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
    const newPass = prompt(`请输入为用户"${username}"设置的新密码（最少6个字符）：`);
    if (newPass === null) return;
    const trimmedPass = newPass.trim();
    if (trimmedPass.length < 6) {
      alert('重置密码失败：密码长度不能少于6个字符！');
      return;
    }
    setUserError(null);
    setUserSuccess(null);
    try {
      await userApi.resetPassword(userId, trimmedPass);
      setUserSuccess(`已成功将用户"${username}"的密码重置为您输入的新密码！`);
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
      setUserSuccess(`新账号"${newUsername}"创建成功！`);
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

  // ─── 渲染 ──────────────────────────────────────────────────────────────────

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
          .season-card { padding: 16px; }
          .season-form { flex-direction: column; align-items: stretch; gap: 12px; }
          .season-form > div { width: 100% !important; }
          .season-form button { width: 100%; justify-content: center; margin-top: 5px; }
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
              fontWeight: activeTab === 'backup' ? '600' : '400',
              color: activeTab === 'backup' ? '#0070f3' : '#666',
              background: activeTab === 'backup' ? '#f0f7ff' : 'none',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            💾 数据灾备与归档
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            style={{
              padding: '8px 18px',
              fontWeight: activeTab === 'groups' ? '600' : '400',
              color: activeTab === 'groups' ? '#0070f3' : '#666',
              background: activeTab === 'groups' ? '#f0f7ff' : 'none',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            🏆 赛季分组配置
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '8px 18px',
              fontWeight: activeTab === 'users' ? '600' : '400',
              color: activeTab === 'users' ? '#0070f3' : '#666',
              background: activeTab === 'users' ? '#f0f7ff' : 'none',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            👥 用户权限管理
          </button>
        </div>

        {/* 全局提示区域 */}
        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
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
          <SeasonBackupPanel
            seasons={seasons}
            activeSeason={activeSeason}
            backups={backups}
            newSeasonName={newSeasonName}
            newSeasonType={newSeasonType}
            isArchivingSeason={isArchivingSeason}
            isLoading={isLoading}
            isBackingUp={isBackingUp}
            isRestoring={isRestoring}
            isUpdatingStatusId={isUpdatingStatusId}
            onNewSeasonNameChange={setNewSeasonName}
            onNewSeasonTypeChange={setNewSeasonType}
            onCreateSeason={handleCreateSeason}
            onUpdateSeasonStatus={handleUpdateSeasonStatus}
            onCreateBackup={handleCreateBackup}
            onRestoreBackup={handleRestore}
            onLoadBackups={loadBackups}
          />
        )}

        {/* 页签: 赛季分组配置 (仅杯赛) */}
        {activeTab === 'groups' && activeSeason?.type === 'CUP' && (
          <CupGroupPanel
            activeSeason={activeSeason}
            teams={teams}
            groupsData={groupsData}
            isSavingGroups={isSavingGroups}
            onTeamGroupChange={handleTeamGroupChange}
            onSaveGroups={handleSaveGroups}
            onGenerateKnockout={handleGenerateKnockout}
          />
        )}
        {activeTab === 'groups' && activeSeason?.type !== 'CUP' && (
          <div className="form-section" style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <span style={{ fontSize: '48px' }}>🏆</span>
            <p style={{ marginTop: '16px', fontSize: '15px' }}>当前活跃赛季为<strong>联赛赛制</strong>，无需进行小组分配。</p>
            <p style={{ fontSize: '13px' }}>如需管理杯赛分组，请先在"数据灾备与归档"页签中创建一个 CUP 类型的赛季并激活。</p>
          </div>
        )}

        {/* 页签 2: 用户权限管理 */}
        {activeTab === 'users' && (
          <UserManagementPanel
            users={users}
            teams={teams}
            isUsersLoading={isUsersLoading}
            userEdits={userEdits}
            newUsername={newUsername}
            newPassword={newPassword}
            newRole={newRole}
            newTeamId={newTeamId}
            isCreatingUser={isCreatingUser}
            onNewUsernameChange={setNewUsername}
            onNewPasswordChange={setNewPassword}
            onNewRoleChange={setNewRole}
            onNewTeamIdChange={setNewTeamId}
            onCreateUser={handleCreateUser}
            onRoleChangeInRow={handleRoleChangeInRow}
            onTeamChangeInRow={handleTeamChangeInRow}
            onUpdateUserRole={handleUpdateUserRole}
            onResetPassword={handleResetPassword}
            onDeleteUser={handleDeleteUser}
            onLoadUsers={loadUsers}
          />
        )}
      </main>
    </div>
  );
};

export default SystemSettingsPage;

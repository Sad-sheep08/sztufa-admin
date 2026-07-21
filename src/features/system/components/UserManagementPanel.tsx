import React from 'react';
import { Plus, RefreshCw, Users, Key, Trash2 } from 'lucide-react';
import { TeamDTO } from '../../../api/types';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

interface UserManagementPanelProps {
  users: any[];
  teams: TeamDTO[];
  isUsersLoading: boolean;
  userEdits: Record<string, { role: string; teamId: string | null }>;
  newUsername: string;
  newPassword: string;
  newRole: string;
  newTeamId: string;
  isCreatingUser: boolean;
  onNewUsernameChange: (val: string) => void;
  onNewPasswordChange: (val: string) => void;
  onNewRoleChange: (val: string) => void;
  onNewTeamIdChange: (val: string) => void;
  onCreateUser: (e: React.FormEvent) => void;
  onRoleChangeInRow: (userId: string, currentRole: string, currentTeamId: string | null, newRole: string) => void;
  onTeamChangeInRow: (userId: string, currentRole: string, currentTeamId: string | null, newTeamId: string | null) => void;
  onUpdateUserRole: (userId: string, role: string, teamId: string | null) => void;
  onResetPassword: (userId: string, username: string) => void;
  onDeleteUser: (userId: string, username: string) => void;
  onLoadUsers: () => void;
}

export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  users,
  teams,
  isUsersLoading,
  userEdits,
  newUsername,
  newPassword,
  newRole,
  newTeamId,
  isCreatingUser,
  onNewUsernameChange,
  onNewPasswordChange,
  onNewRoleChange,
  onNewTeamIdChange,
  onCreateUser,
  onRoleChangeInRow,
  onTeamChangeInRow,
  onUpdateUserRole,
  onResetPassword,
  onDeleteUser,
  onLoadUsers,
}) => {
  return (
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
          <form onSubmit={onCreateUser} className="create-user-form" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#555', marginBottom: '8px' }}>用户名</label>
              <input
                type="text"
                placeholder="账号用户名"
                value={newUsername}
                onChange={(e) => onNewUsernameChange(e.target.value)}
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
                onChange={(e) => onNewPasswordChange(e.target.value)}
                disabled={isCreatingUser}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ width: '150px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#555', marginBottom: '8px' }}>角色权限</label>
              <select
                value={newRole}
                onChange={(e) => onNewRoleChange(e.target.value)}
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
                  onChange={(e) => onNewTeamIdChange(e.target.value)}
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
          <button onClick={onLoadUsers} className="add-btn refresh-btn" disabled={isUsersLoading} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', height: 'auto' }}>
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
                          onChange={(e) => onRoleChangeInRow(u.id, u.role, u.teamId, e.target.value)}
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
                            onChange={(e) => onTeamChangeInRow(u.id, u.role, u.teamId, e.target.value || null)}
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
                            onClick={() => onUpdateUserRole(u.id, activeRole, activeTeamId)}
                            disabled={!hasChanges}
                            className="add-btn small"
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', height: 'auto', margin: 0 }}
                          >
                            保存
                          </button>
                          <button
                            onClick={() => onResetPassword(u.id, u.username)}
                            className="add-btn small"
                            style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 10px', height: 'auto', margin: 0, backgroundColor: '#f0ad4e', borderColor: '#eea236', color: '#fff' }}
                          >
                            <Key size={12} style={{ marginRight: '3px' }} />
                            重置
                          </button>
                          <button
                            onClick={() => onDeleteUser(u.id, u.username)}
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
  );
};

import React, { useState } from 'react';
import { CheckCircle2, Database, FileCheck } from 'lucide-react';
import { CupGroupPanel, SeasonBackupPanel, UserManagementPanel } from './components';
import ConfirmDialog from '../../components/ConfirmDialog';
import PasswordDialog from '../../components/PasswordDialog';
import {
  useCupGroupSettings,
  useSeasonBackupSettings,
  useSystemTeams,
  useUserManagement,
} from './hooks';

type SettingsTab = 'backup' | 'groups' | 'users';

const tabButtonStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 18px',
  fontWeight: active ? '600' : '400',
  color: active ? '#0070f3' : '#666',
  background: active ? '#f0f7ff' : 'none',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
});

const SystemSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('backup');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const feedback = { setError, setSuccessMessage };

  const seasonBackup = useSeasonBackupSettings(feedback);
  const { teams } = useSystemTeams();
  const cupGroups = useCupGroupSettings(seasonBackup.activeSeason, feedback);
  const userManagement = useUserManagement(teams, activeTab === 'users');

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
        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid #e9ecef', paddingBottom: '12px' }}>
          <button onClick={() => setActiveTab('backup')} style={tabButtonStyle(activeTab === 'backup')}>
            💾 数据灾备与归档
          </button>
          <button onClick={() => setActiveTab('groups')} style={tabButtonStyle(activeTab === 'groups')}>
            🏆 赛季分组配置
          </button>
          <button onClick={() => setActiveTab('users')} style={tabButtonStyle(activeTab === 'users')}>
            👥 用户权限管理
          </button>
        </div>

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
        {userManagement.userError && (
          <div className="error-message">
            <span>{userManagement.userError}</span>
          </div>
        )}
        {userManagement.userSuccess && (
          <div className="save-success" style={{ display: 'flex', marginBottom: '20px' }}>
            <CheckCircle2 size={20} style={{ color: '#2b8a3e' }} />
            <span>{userManagement.userSuccess}</span>
          </div>
        )}

        {activeTab === 'backup' && (
          <SeasonBackupPanel
            seasons={seasonBackup.seasons}
            activeSeason={seasonBackup.activeSeason}
            backups={seasonBackup.backups}
            newSeasonName={seasonBackup.newSeasonName}
            newSeasonType={seasonBackup.newSeasonType}
            isArchivingSeason={seasonBackup.isArchivingSeason}
            isLoading={seasonBackup.isLoading}
            isBackingUp={seasonBackup.isBackingUp}
            isRestoring={seasonBackup.isRestoring}
            isUpdatingStatusId={seasonBackup.isUpdatingStatusId}
            isRenamingSeasonId={seasonBackup.isRenamingSeasonId}
            isDeletingSeasonId={seasonBackup.isDeletingSeasonId}
            onNewSeasonNameChange={seasonBackup.setNewSeasonName}
            onNewSeasonTypeChange={seasonBackup.setNewSeasonType}
            onCreateSeason={seasonBackup.handleCreateSeason}
            onUpdateSeasonStatus={seasonBackup.handleUpdateSeasonStatus}
            onRenameSeason={seasonBackup.handleRenameSeason}
            onDeleteSeason={seasonBackup.handleDeleteSeason}
            onCreateBackup={seasonBackup.handleCreateBackup}
            onRestoreBackup={seasonBackup.handleRestore}
            onLoadBackups={seasonBackup.loadBackups}
          />
        )}

        {activeTab === 'groups' && seasonBackup.activeSeason?.type === 'CUP' && (
          <CupGroupPanel
            activeSeason={seasonBackup.activeSeason}
            teams={teams}
            groupsData={cupGroups.groupsData}
            isSavingGroups={cupGroups.isSavingGroups}
            onTeamGroupChange={cupGroups.handleTeamGroupChange}
            onSaveGroups={cupGroups.handleSaveGroups}
            onGenerateKnockout={cupGroups.handleGenerateKnockout}
          />
        )}
        {activeTab === 'groups' && seasonBackup.activeSeason?.type !== 'CUP' && (
          <div className="form-section" style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <span style={{ fontSize: '48px' }}>🏆</span>
            <p style={{ marginTop: '16px', fontSize: '15px' }}>当前活跃赛季为<strong>联赛赛制</strong>，无需进行小组分配。</p>
            <p style={{ fontSize: '13px' }}>如需管理杯赛分组，请先在"数据灾备与归档"页签中创建一个 CUP 类型的赛季并激活。</p>
          </div>
        )}

        {activeTab === 'users' && (
          <UserManagementPanel
            users={userManagement.users}
            teams={teams}
            isUsersLoading={userManagement.isUsersLoading}
            userEdits={userManagement.userEdits}
            newUsername={userManagement.newUsername}
            newPassword={userManagement.newPassword}
            newRole={userManagement.newRole}
            newTeamId={userManagement.newTeamId}
            isCreatingUser={userManagement.isCreatingUser}
            onNewUsernameChange={userManagement.setNewUsername}
            onNewPasswordChange={userManagement.setNewPassword}
            onNewRoleChange={userManagement.setNewRole}
            onNewTeamIdChange={userManagement.setNewTeamId}
            onCreateUser={userManagement.handleCreateUser}
            onRoleChangeInRow={userManagement.handleRoleChangeInRow}
            onTeamChangeInRow={userManagement.handleTeamChangeInRow}
            onUpdateUserRole={userManagement.handleUpdateUserRole}
            onResetPassword={userManagement.handleResetPassword}
            onDeleteUser={userManagement.handleDeleteUser}
            onLoadUsers={userManagement.loadUsers}
          />
        )}

      </main>

      {/* 确认删除弹窗 */}
      <ConfirmDialog
        isOpen={userManagement.confirmDialog.isOpen}
        onClose={userManagement.closeConfirmDialog}
        onConfirm={userManagement.confirmDialog.onConfirm}
        title={userManagement.confirmDialog.title}
        message={userManagement.confirmDialog.message}
        type={userManagement.confirmDialog.type}
        confirmText="确认删除"
        cancelText="取消"
      />

      {/* 密码重置弹窗 */}
      <PasswordDialog
        isOpen={userManagement.passwordDialog.isOpen}
        onClose={userManagement.closePasswordDialog}
        onSubmit={userManagement.handlePasswordSubmit}
        username={userManagement.passwordDialog.username}
      />
    </div>
  );
};

export default SystemSettingsPage;

import React, { useCallback, useEffect, useState } from 'react';
import { authApi, userApi } from '../../../api/service';
import { TeamDTO } from '../../../api/types';
import { updateUserRoleEdit, updateUserTeamEdit } from './settingsState';
import { UserEdit, UserSummary } from './types';

export const useUserManagement = (teams: TeamDTO[], enabled: boolean) => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userEdits, setUserEdits] = useState<Record<string, UserEdit>>({});
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [newTeamId, setNewTeamId] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  // 确认弹窗状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger',
  });

  // 密码重置弹窗状态
  const [passwordDialog, setPasswordDialog] = useState<{
    isOpen: boolean;
    userId: string;
    username: string;
  }>({
    isOpen: false,
    userId: '',
    username: '',
  });

  const loadUsers = useCallback(async () => {
    setIsUsersLoading(true);
    setUserError(null);
    try {
      const data = await userApi.getAll();
      setUsers(data || []);
      setUserEdits({});
    } catch (error) {
      console.error('加载用户列表失败:', error);
      setUserError('获取用户列表失败，请检查网络或登录状态');
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      loadUsers();
    }
  }, [enabled, loadUsers]);

  const handleRoleChangeInRow = (
    userId: string,
    currentRole: string,
    currentTeamId: string | null,
    role: string,
  ) => {
    setUserEdits(previous => updateUserRoleEdit(
      previous,
      userId,
      currentRole,
      currentTeamId,
      role,
      teams[0]?.id || null,
    ));
  };

  const handleTeamChangeInRow = (
    userId: string,
    currentRole: string,
    currentTeamId: string | null,
    teamId: string | null,
  ) => {
    setUserEdits(previous => updateUserTeamEdit(
      previous,
      userId,
      currentRole,
      currentTeamId,
      teamId,
    ));
  };

  const handleUpdateUserRole = async (userId: string, role: string, teamId: string | null) => {
    setUserError(null);
    setUserSuccess(null);
    try {
      await userApi.updateRole(userId, role, teamId);
      setUserSuccess('成功更新用户权限！');
      setUserEdits(previous => {
        const next = { ...previous };
        delete next[userId];
        return next;
      });
      loadUsers();
      setTimeout(() => setUserSuccess(null), 3000);
    } catch (error) {
      console.error('修改权限失败:', error);
      setUserError(error instanceof Error ? error.message : '更新用户权限失败');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除用户',
      message: `【警告】确定要永久删除用户账号"${username}"吗？此操作无法恢复！`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        setUserError(null);
        setUserSuccess(null);
        try {
          await userApi.delete(userId);
          setUserSuccess('用户账号已删除');
          loadUsers();
          setTimeout(() => setUserSuccess(null), 3000);
        } catch (error) {
          console.error('删除用户失败:', error);
          setUserError(error instanceof Error ? error.message : '删除用户失败');
        }
      },
    });
  };

  const handleResetPassword = async (userId: string, username: string) => {
    setPasswordDialog({
      isOpen: true,
      userId,
      username,
    });
  };

  const handlePasswordSubmit = async (newPass: string) => {
    const { userId, username } = passwordDialog;
    const trimmedPass = newPass.trim();
    if (trimmedPass.length < 6) {
      setUserError('重置密码失败：密码长度不能少于6个字符！');
      return;
    }
    
    setUserError(null);
    setUserSuccess(null);
    try {
      await userApi.resetPassword(userId, trimmedPass);
      setPasswordDialog(prev => ({ ...prev, isOpen: false }));
      setUserSuccess(`已成功将用户"${username}"的密码重置为您输入的新密码！`);
      setTimeout(() => setUserSuccess(null), 3000);
    } catch (error) {
      console.error('重置密码失败:', error);
      setUserError(error instanceof Error ? error.message : '重置密码失败');
      throw error;
    }
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setUserError('用户名和密码不能为空');
      return;
    }
    setIsCreatingUser(true);
    setUserError(null);
    setUserSuccess(null);
    try {
      await authApi.createUser({
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
    } catch (error) {
      console.error('创建用户失败:', error);
      setUserError(error instanceof Error ? error.message : '创建用户失败，可能用户名已存在');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const closePasswordDialog = () => {
    setPasswordDialog(prev => ({ ...prev, isOpen: false }));
  };

  return {
    users,
    isUsersLoading,
    userEdits,
    newUsername,
    newPassword,
    newRole,
    newTeamId,
    isCreatingUser,
    userError,
    userSuccess,
    setNewUsername,
    setNewPassword,
    setNewRole,
    setNewTeamId,
    loadUsers,
    handleRoleChangeInRow,
    handleTeamChangeInRow,
    handleUpdateUserRole,
    handleDeleteUser,
    handleResetPassword,
    handleCreateUser,
    handlePasswordSubmit,
    closeConfirmDialog,
    closePasswordDialog,
    confirmDialog,
    passwordDialog,
  };
};

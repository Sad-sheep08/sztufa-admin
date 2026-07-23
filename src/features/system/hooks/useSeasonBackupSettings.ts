import React, { useCallback, useEffect, useState } from 'react';
import { backupApi, seasonApi } from '../../../api/service';
import { BackupDTO } from '../../../api/types';
import { SeasonSummary, SystemFeedback } from './types';

export const useSeasonBackupSettings = ({ setError, setSuccessMessage }: SystemFeedback) => {
  const [backups, setBackups] = useState<BackupDTO[]>([]);
  const [activeSeason, setActiveSeason] = useState<SeasonSummary | null>(null);
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonType, setNewSeasonType] = useState('LEAGUE');
  const [isArchivingSeason, setIsArchivingSeason] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<SeasonSummary[]>([]);
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);
  const [isRenamingSeasonId, setIsRenamingSeasonId] = useState<string | null>(null);
  const [isDeletingSeasonId, setIsDeletingSeasonId] = useState<string | null>(null);

  const loadAllSeasons = useCallback(async () => {
    try {
      const data = await seasonApi.getAll();
      setSeasons(data || []);
    } catch (error) {
      console.error('加载所有赛季失败:', error);
    }
  }, []);

  const loadBackups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await backupApi.list();
      if (response.success) {
        setBackups(response.data || []);
      }
    } catch (error) {
      console.error('加载备份列表失败:', error);
      setError('无法获取云端备份列表，请检查网络或 R2 连接');
    } finally {
      setIsLoading(false);
    }
  }, [setError]);

  const loadActiveSeason = useCallback(async () => {
    try {
      const data = await seasonApi.getActive();
      setActiveSeason(data);
    } catch (error) {
      console.error('加载活跃赛季失败:', error);
      setActiveSeason(null);
    }
  }, []);

  useEffect(() => {
    loadBackups();
    loadActiveSeason();
    loadAllSeasons();
  }, [loadActiveSeason, loadAllSeasons, loadBackups]);

  const handleCreateSeason = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSeasonName.trim()) return;
    if (!confirm(`确定要创建新赛季"${newSeasonName}"并将其直接设为活跃状态吗？\n\n此操作会重置球员的卡片数，但不会强行归档现有的其他活跃赛季。`)) return;

    setIsArchivingSeason(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await seasonApi.create(newSeasonName, newSeasonType);
      setSuccessMessage(`已成功创建新活跃赛季：${response.name}`);
      setNewSeasonName('');
      loadActiveSeason();
      loadAllSeasons();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('创建新赛季失败:', error);
      setError(error instanceof Error ? error.message : '创建新赛季失败');
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
    } catch (error) {
      console.error('更新赛季状态失败:', error);
      setError(error instanceof Error ? error.message : '更新赛季状态失败');
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  const handleRenameSeason = async (id: string, currentName: string, newName: string) => {
    const name = newName.trim();
    if (!name || name === currentName) return;

    setIsRenamingSeasonId(id);
    setError(null);
    setSuccessMessage(null);
    try {
      await seasonApi.rename(id, name);
      setSuccessMessage(`赛季已重命名为“${name}”`);
      await Promise.all([loadActiveSeason(), loadAllSeasons()]);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('修改赛季名称失败:', error);
      setError(error instanceof Error ? error.message : '修改赛季名称失败');
    } finally {
      setIsRenamingSeasonId(null);
    }
  };

  const handleDeleteSeason = async (id: string, name: string) => {
    setIsDeletingSeasonId(id);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await seasonApi.delete(id);
      setSuccessMessage(`已删除赛季“${name}”及其 ${response.deleted?.matches ?? 0} 场比赛`);
      await Promise.all([loadActiveSeason(), loadAllSeasons()]);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (error) {
      console.error('删除赛季失败:', error);
      setError(error instanceof Error ? error.message : '删除赛季失败');
    } finally {
      setIsDeletingSeasonId(null);
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
    } catch (error) {
      console.error('创建备份失败:', error);
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
    } catch (error) {
      console.error('还原备份失败:', error);
      setError('还原失败，备份文件可能损坏或网络连接中断');
    } finally {
      setIsRestoring(null);
    }
  };

  return {
    backups,
    activeSeason,
    newSeasonName,
    newSeasonType,
    isArchivingSeason,
    isLoading,
    isBackingUp,
    isRestoring,
    seasons,
    isUpdatingStatusId,
    isRenamingSeasonId,
    isDeletingSeasonId,
    setNewSeasonName,
    setNewSeasonType,
    loadBackups,
    handleCreateSeason,
    handleUpdateSeasonStatus,
    handleRenameSeason,
    handleDeleteSeason,
    handleCreateBackup,
    handleRestore,
  };
};

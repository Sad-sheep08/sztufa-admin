import { useCallback, useEffect, useState } from 'react';
import { seasonApi } from '../../../api/service';
import { replaceTeamGroup } from './settingsState';
import { SeasonGroupAssignment, SeasonSummary, SystemFeedback } from './types';

export const useCupGroupSettings = (
  activeSeason: SeasonSummary | null,
  { setError, setSuccessMessage }: SystemFeedback,
) => {
  const [groupsData, setGroupsData] = useState<SeasonGroupAssignment[]>([]);
  const [isSavingGroups, setIsSavingGroups] = useState(false);

  const loadSeasonGroups = useCallback(async (seasonId: string) => {
    try {
      const data = await seasonApi.getGroups(seasonId);
      setGroupsData((data || []).map((group: any) => ({
        teamId: group.teamId,
        groupName: group.groupName,
      })));
    } catch (error) {
      console.error('加载分组失败:', error);
    }
  }, []);

  useEffect(() => {
    if (activeSeason?.type === 'CUP') {
      loadSeasonGroups(activeSeason.id);
    }
  }, [activeSeason, loadSeasonGroups]);

  const handleTeamGroupChange = (teamId: string, groupName: string) => {
    setGroupsData(previous => replaceTeamGroup(previous, teamId, groupName));
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
    } catch (error) {
      console.error('保存分组失败:', error);
      setError(error instanceof Error ? error.message : '保存分组失败');
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
      const response = await seasonApi.generateKnockout(activeSeason.id);
      setSuccessMessage(`淘汰赛对阵生成成功！已生成首轮淘汰赛轮次: ${response.round}，新建了 ${response.countCreated} 场，更新了 ${response.countUpdated} 场比赛。请到比赛信息管理页面查看对阵结果。`);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (error) {
      console.error('一键生成淘汰赛失败:', error);
      setError(error instanceof Error ? error.message : '一键生成淘汰赛失败，请先确认小组赛比分已录入且系统已计算出积分榜');
    }
  };

  return {
    groupsData,
    isSavingGroups,
    handleTeamGroupChange,
    handleSaveGroups,
    handleGenerateKnockout,
  };
};

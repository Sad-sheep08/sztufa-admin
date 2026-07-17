import { useState, useEffect } from 'react';
import { teamApi, playerApi, matchApi, seasonApi } from '../../../api/service';
import { TeamDTO, PlayerDTO, MatchDTO } from '../../../api/types';
import { Team, Player } from '../../../types';
import { generateId } from '../../../utils';
import * as XLSX from 'xlsx';

export function useTeamData(user: any) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number; message: string } | null>(null);

  const [editData, setEditData] = useState<Team | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [allMatches, setAllMatches] = useState<MatchDTO[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [activeSeasonName, setActiveSeasonName] = useState<string>('');

  const [seasons, setSeasons] = useState<any[]>([]);
  const [filterSeasonId, setFilterSeasonId] = useState<string>('all');

  useEffect(() => {
    const initPage = async () => {
      try {
        const seasonList = await seasonApi.getAll();
        setSeasons(seasonList || []);

        const active = seasonList.find((s: any) => s.status === 'active');
        if (active) {
          setFilterSeasonId(active.id);
          setActiveSeasonId(active.id);
          setActiveSeasonName(active.name);
        }
      } catch (err) {
        console.error('加载赛季列表失败:', err);
      }
    };
    initPage();
  }, []);

  useEffect(() => {
    loadTeams(filterSeasonId);
    if (filterSeasonId !== 'all') {
      loadActiveSeasonAndMatchesForSeason(filterSeasonId);
    } else {
      setAllMatches([]);
    }
  }, [filterSeasonId, seasons]);

  const loadActiveSeasonAndMatchesForSeason = async (seasonId: string) => {
    try {
      const response = await matchApi.getAll(1, 200, undefined, seasonId === 'all' ? undefined : seasonId);
      setAllMatches(response.data || []);

      const currentSeason = seasons.find(s => s.id === seasonId);
      if (currentSeason) {
        setActiveSeasonId(currentSeason.id);
        setActiveSeasonName(currentSeason.name);
      }
    } catch (err) {
      console.error('加载比赛记录失败:', err);
    }
  };

  const loadTeams = async (seasonId = filterSeasonId) => {
    setIsLoading(true);
    try {
      let gender = 'MALE';
      if (seasonId !== 'all') {
        const currentSeason = seasons.find(s => s.id === seasonId);
        if (currentSeason && (currentSeason.name.includes('女') || currentSeason.name.includes('女子'))) {
          gender = 'FEMALE';
        }
      } else {
        gender = 'all';
      }

      const response = await teamApi.getAll(
        1,
        200,
        seasonId === 'all' ? undefined : seasonId,
        gender === 'all' ? undefined : gender
      );
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
        gender: t.gender || 'MALE',
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

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSaveEdit = async () => {
    if (!editData) return;

    if (!editData.teamName?.trim()) {
      setError('请输入队伍名称');
      return;
    }
    if (editData.teamName.trim().length > 100) {
      setError('球队名称长度不能超过100个字符');
      return;
    }
    if (!editData.headCoach?.trim()) {
      setError('请输入主教练姓名');
      return;
    }
    if (!editData.teamLeader?.trim()) {
      setError('请输入领队姓名');
      return;
    }
    if (!editData.teamDoctor?.trim()) {
      setError('请输入队医姓名');
      return;
    }
    if (!editData.coachPhone?.trim()) {
      setError('请输入主教练联系方式');
      return;
    }
    if (!validatePhone(editData.coachPhone || '')) {
      setError('主教练联系方式格式不正确，请输入11位手机号');
      return;
    }
    if (!editData.leaderPhone?.trim()) {
      setError('请输入领队联系方式');
      return;
    }
    if (!validatePhone(editData.leaderPhone || '')) {
      setError('领队联系方式格式不正确，请输入11位手机号');
      return;
    }
    if (!editData.homeJerseyColor?.trim()) {
      setError('请输入主队球衣颜色');
      return;
    }
    if (!editData.awayJerseyColor?.trim()) {
      setError('请输入客队球衣颜色');
      return;
    }

    if (editData.players) {
      const studentIds = new Set<string>();
      const jerseyNumbers = new Set<string>();
      for (let i = 0; i < editData.players.length; i++) {
        const p = editData.players[i];
        if (!p.name.trim()) {
          setError(`第 ${i + 1} 个球员的姓名不能为空`);
          return;
        }
        const sId = p.studentId.trim();
        const jNum = String(p.jerseyNumber || '').trim();
        if (!sId) {
          setError(`第 ${i + 1} 个球员的学号不能为空`);
          return;
        }
        if (!jNum) {
          setError(`第 ${i + 1} 个球员的球衣号码不能为空`);
          return;
        }
        if (studentIds.has(sId)) {
          setError(`球员列表中存在重复的学号: ${sId}`);
          return;
        }
        if (jerseyNumbers.has(jNum)) {
          setError(`球员列表中存在重复的球衣号码: ${jNum}`);
          return;
        }
        studentIds.add(sId);
        jerseyNumbers.add(jNum);
      }
    }

    setIsLoading(true);
    setError(null);

    const originalPlayers = selectedTeam?.players || [];
    const currentPlayers = editData.players || [];
    const playersToDelete = originalPlayers.filter(
      op => !currentPlayers.some(cp => cp.id === op.id)
    );
    const playersToCreate = [];
    const playersToUpdate = [];
    for (const p of currentPlayers) {
      const original = originalPlayers.find(op => op.id === p.id);
      if (!original) {
        playersToCreate.push(p);
      } else if (
        original.name !== p.name ||
        original.studentId !== p.studentId ||
        original.jerseyNumber !== p.jerseyNumber ||
        (original.status || 'active') !== (p.status || 'active') ||
        Number(original.yellowCards || 0) !== Number(p.yellowCards || 0) ||
        Number(original.redCards || 0) !== Number(p.redCards || 0) ||
        original.photo !== p.photo
      ) {
        playersToUpdate.push(p);
      }
    }

    const totalSteps = 1 + playersToDelete.length + playersToCreate.length + playersToUpdate.length;
    let currentStep = 0;

    try {
      setSaveProgress({ current: currentStep, total: totalSteps, message: '正在更新球队基本信息...' });

      const editTeamDTO = {
        teamName: editData.teamName,
        teamDoctor: editData.teamDoctor,
        headCoach: editData.headCoach,
        teamLeader: editData.teamLeader,
        coachPhone: editData.coachPhone,
        leaderPhone: editData.leaderPhone,
        homeJerseyColor: editData.homeJerseyColor,
        awayJerseyColor: editData.awayJerseyColor,
        teamLogo: editData.teamLogo || null,
        homeJersey: editData.homeJersey || null,
        awayJersey: editData.awayJersey || null,
        gender: editData.gender,
      };

      await teamApi.update(editData.id, editTeamDTO);
      currentStep++;
      setSaveProgress({ current: currentStep, total: totalSteps, message: '球队基本信息更新完成，开始同步球员数据...' });

      for (const p of playersToDelete) {
        setSaveProgress({
          current: currentStep,
          total: totalSteps,
          message: `正在删除已移除的球员: ${p.name}...`
        });
        await playerApi.delete(p.id);
        currentStep++;
      }

      for (const p of playersToCreate) {
        setSaveProgress({
          current: currentStep,
          total: totalSteps,
          message: `正在添加新球员: ${p.name} (学号 ${p.studentId})...`
        });
        const playerDTO = {
          name: p.name,
          studentId: p.studentId,
          jerseyNumber: p.jerseyNumber,
          status: p.status || 'active',
          yellowCards: Number(p.yellowCards) || 0,
          redCards: Number(p.redCards) || 0,
          photo: p.photo || null,
          teamId: editData.id,
        };
        await playerApi.create(playerDTO);
        currentStep++;
      }

      for (const p of playersToUpdate) {
        setSaveProgress({
          current: currentStep,
          total: totalSteps,
          message: `正在更新球员数据: ${p.name}...`
        });
        const playerDTO = {
          name: p.name,
          studentId: p.studentId,
          jerseyNumber: p.jerseyNumber,
          status: p.status || 'active',
          yellowCards: Number(p.yellowCards) || 0,
          redCards: Number(p.redCards) || 0,
          photo: p.photo || null,
          teamId: editData.id,
        };
        await playerApi.update(p.id, playerDTO);
        currentStep++;
      }

      setSaveProgress({
        current: totalSteps,
        total: totalSteps,
        message: '同步完成！正在重新加载数据...'
      });

      setIsSaved(true);
      setError(null);

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
      setError('更新失败: ' + (err instanceof Error ? err.message : '网络连接错误或学号已被占用'));
    } finally {
      setIsLoading(false);
      setSaveProgress(null);
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
      setError('球队已成功删除');
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
      const mergedPlayers = editData.players ? [...editData.players] : [];
      let studentIdDupCount = 0;
      let jerseyNumDupCount = 0;

      for (const p of importedPlayers) {
        const sId = String(p.studentId).trim();
        const jNum = String(p.jerseyNumber).trim();
        if (mergedPlayers.some((mp) => mp.studentId === sId)) {
          studentIdDupCount++;
          continue;
        }
        if (mergedPlayers.some((mp) => mp.jerseyNumber === jNum)) {
          jerseyNumDupCount++;
          continue;
        }
        mergedPlayers.push({
          ...p,
          studentId: sId,
          jerseyNumber: jNum,
          id: generateId(),
          teamId: editData.id,
        });
      }

      setEditData({ ...editData, players: mergedPlayers });
      setShowImporter(false);

      let msg = `成功导入 ${importedPlayers.length - studentIdDupCount - jerseyNumDupCount} 名球员。`;
      if (studentIdDupCount > 0) msg += `跳过了 ${studentIdDupCount} 名学号重复的球员。`;
      if (jerseyNumDupCount > 0) msg += `跳过了 ${jerseyNumDupCount} 名球衣号码重复的球员。`;
      setError(msg);
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

  return {
    teams, selectedTeam, isEditing, isLoading, error, isSaved, saveProgress,
    editData, showImporter, allMatches, activeSeasonId, activeSeasonName,
    seasons, filterSeasonId,
    setFilterSeasonId, setShowImporter, setError,
    loadTeams, handleViewTeam, handleEditTeam, handleSaveEdit,
    handleDeleteTeam, handleCancelEdit, handleFieldChange,
    handlePlayerFieldChange, handleDeletePlayerRow, handleAddPlayerRow,
    handleExcelImport, handleExportPlayers,
  };
}

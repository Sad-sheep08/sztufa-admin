import { useState, useEffect, useRef } from 'react';
import { teamApi, matchApi, seasonApi } from '../../../api/service';
import { TeamDTO, PlayerDTO, MatchDTO } from '../../../api/types';
import { Team, Player } from '../../../types';
import { generateId } from '../../../utils';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 10;

export function useTeamData(user: any) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTeams, setTotalTeams] = useState(0);
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

  const teamsRequestIdRef = useRef(0);
  const matchesRequestIdRef = useRef(0);

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
    loadTeams(currentPage, filterSeasonId);
  }, [currentPage, filterSeasonId, seasons]);

  useEffect(() => {
    if (filterSeasonId !== 'all') {
      loadActiveSeasonAndMatchesForSeason(filterSeasonId);
    } else {
      setAllMatches([]);
    }
  }, [filterSeasonId, seasons]);

  const loadActiveSeasonAndMatchesForSeason = async (seasonId: string) => {
    const requestId = ++matchesRequestIdRef.current;
    try {
      const response = await matchApi.getAll(1, 200, undefined, seasonId === 'all' ? undefined : seasonId);

      if (requestId !== matchesRequestIdRef.current) return;

      setAllMatches(response.data || []);

      const currentSeason = seasons.find(s => s.id === seasonId);
      if (currentSeason) {
        setActiveSeasonId(currentSeason.id);
        setActiveSeasonName(currentSeason.name);
      }
    } catch (err) {
      if (requestId !== matchesRequestIdRef.current) return;
      console.error('加载比赛记录失败:', err);
    }
  };

  const loadTeams = async (page = currentPage, seasonId = filterSeasonId) => {
    const requestId = ++teamsRequestIdRef.current;
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
        user?.role === 'coach' ? 1 : page,
        user?.role === 'coach' ? 100 : PAGE_SIZE,
        seasonId === 'all' ? undefined : seasonId,
        gender === 'all' ? undefined : gender
      );

      if (requestId !== teamsRequestIdRef.current) return;

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
        setTotalTeams(filteredTeams.length);
        if (filteredTeams.length > 0) {
          setSelectedTeam(filteredTeams[0]);
        }
      } else {
        setTeams(teamList);
        setTotalTeams(response.total);
      }
    } catch (err) {
      if (requestId !== teamsRequestIdRef.current) return;
      console.error('加载球队列表失败:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        setError('请先登录系统');
      } else {
        setError('网络连接失败，请稍后重试');
      }
    } finally {
      if (requestId === teamsRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSeasonChange = (seasonId: string) => {
    setFilterSeasonId(seasonId);
    setCurrentPage(1);
    setSelectedTeam(null);
    setEditData(null);
    setIsEditing(false);
  };

  const handlePageChange = (page: number) => {
    const totalPages = Math.ceil(totalTeams / PAGE_SIZE);
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
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
        const jNum = String(p.jerseyNumber ?? '').trim();
        if (!sId) {
          setError(`第 ${i + 1} 个球员的学号不能为空`);
          return;
        }
        if (jNum === '') {
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

    const deletePlayerIds = originalPlayers
      .filter(op => !currentPlayers.some(cp => cp.id === op.id))
      .map(p => p.id);

    const playersPayload = currentPlayers.map(p => ({
      id: p.id.startsWith('temp_') ? undefined : p.id,
      name: p.name,
      studentId: p.studentId,
      jerseyNumber: p.jerseyNumber,
      status: p.status || 'active',
      yellowCards: Number(p.yellowCards) || 0,
      redCards: Number(p.redCards) || 0,
      photo: p.photo || null,
    }));

    try {
      setSaveProgress({ current: 0, total: 1, message: '正在提交变更...' });

      let updatedTeam: TeamDTO;
      const updatePayload = {
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

      try {
        updatedTeam = await teamApi.updateWithPlayers(editData.id, {
          ...updatePayload,
          players: playersPayload,
          deletePlayerIds,
        });
      } catch (patchErr: any) {
        if (patchErr?.message?.includes('404') || patchErr?.message?.includes('Cannot PATCH')) {
          console.warn('后端尚未支持 with-players 批量更新接口，降级调用基本信息更新接口');
          updatedTeam = await teamApi.update(editData.id, updatePayload);
        } else {
          throw patchErr;
        }
      }

      setSaveProgress({
        current: 1,
        total: 1,
        message: '保存完成！正在重新加载数据...'
      });

      const mappedTeam: Team = {
        id: updatedTeam.id || editData.id,
        teamName: updatedTeam.teamName,
        teamDoctor: updatedTeam.teamDoctor,
        headCoach: updatedTeam.headCoach,
        teamLeader: updatedTeam.teamLeader,
        coachPhone: updatedTeam.coachPhone,
        leaderPhone: updatedTeam.leaderPhone,
        homeJerseyColor: updatedTeam.homeJerseyColor,
        awayJerseyColor: updatedTeam.awayJerseyColor,
        teamLogo: updatedTeam.teamLogo || null,
        homeJersey: updatedTeam.homeJersey || null,
        awayJersey: updatedTeam.awayJersey || null,
        gender: updatedTeam.gender || 'MALE',
        players: updatedTeam.players?.map((p: PlayerDTO) => ({
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
      };

      setSelectedTeam(mappedTeam);
      setIsSaved(true);
      setError(null);

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
      const nextPage = teams.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      } else {
        await loadTeams(nextPage, filterSeasonId);
      }
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
        const sId = String(p.studentId ?? '').trim();
        const jNum = String(p.jerseyNumber ?? '').trim();
        if (mergedPlayers.some((mp) => mp.studentId === sId)) {
          studentIdDupCount++;
          continue;
        }
        if (mergedPlayers.some((mp) => String(mp.jerseyNumber ?? '') === jNum)) {
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
    seasons, filterSeasonId, currentPage, totalTeams, pageSize: PAGE_SIZE,
    handleSeasonChange, handlePageChange, setShowImporter, setError,
    loadTeams, handleViewTeam, handleEditTeam, handleSaveEdit,
    handleDeleteTeam, handleCancelEdit, handleFieldChange,
    handlePlayerFieldChange, handleDeletePlayerRow, handleAddPlayerRow,
    handleExcelImport, handleExportPlayers,
  };
}

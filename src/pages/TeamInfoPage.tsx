import React, { useState } from 'react';
import { Save, Download, CheckCircle, Trophy, FileJson, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import TeamForm from '../components/TeamForm';
import PlayerList from '../components/PlayerList';
import ExcelImporter from '../components/ExcelImporter';
import { Team, TeamFormData, Player } from '../types';
import { generateId, fileToBase64 } from '../utils';
import { teamApi } from '../api/service';
import { TeamDTO, PlayerDTO } from '../api/types';

const TeamInfoPage: React.FC = () => {
  const [teamFormData, setTeamFormData] = useState<TeamFormData>({
    teamName: '',
    teamDoctor: '',
    headCoach: '',
    teamLeader: '',
    coachPhone: '',
    leaderPhone: '',
    homeJerseyColor: '',
    awayJerseyColor: '',
    teamLogo: null,
    homeJersey: null,
    awayJersey: null,
    league: '',
    foundedDate: '',
    homeStadium: '',
    homeCity: '',
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTeam, setSavedTeam] = useState<Team | null>(null);

  const handleAddPlayer = (player: Omit<Player, 'id'>) => {
    setPlayers((prev) => [...prev, { ...player, id: generateId() }]);
    setError(null);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setError(null);
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    setError(null);
  };

  const handleImportPlayers = (importedPlayers: Omit<Player, 'id'>[]) => {
    const newPlayers = importedPlayers.map((p) => ({ ...p, id: generateId() }));
    setPlayers((prev) => [...prev, ...newPlayers]);
    setError(null);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    if (!teamFormData.teamName.trim()) {
      setError('请输入队伍名称');
      return false;
    }
    if (!teamFormData.headCoach.trim()) {
      setError('请输入主教练姓名');
      return false;
    }
    if (!teamFormData.teamLeader.trim()) {
      setError('请输入领队姓名');
      return false;
    }
    if (!teamFormData.teamDoctor.trim()) {
      setError('请输入队医姓名');
      return false;
    }
    if (!teamFormData.coachPhone.trim()) {
      setError('请输入主教练联系方式');
      return false;
    }
    if (!validatePhone(teamFormData.coachPhone)) {
      setError('主教练联系方式格式不正确，请输入11位手机号');
      return false;
    }
    if (!teamFormData.leaderPhone.trim()) {
      setError('请输入领队联系方式');
      return false;
    }
    if (!validatePhone(teamFormData.leaderPhone)) {
      setError('领队联系方式格式不正确，请输入11位手机号');
      return false;
    }
    if (!teamFormData.homeJerseyColor.trim()) {
      setError('请输入主队球衣颜色');
      return false;
    }
    if (!teamFormData.awayJerseyColor.trim()) {
      setError('请输入客队球衣颜色');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const teamLogoBase64 = teamFormData.teamLogo
        ? await fileToBase64(teamFormData.teamLogo)
        : null;
      const homeJerseyBase64 = teamFormData.homeJersey
        ? await fileToBase64(teamFormData.homeJersey)
        : null;
      const awayJerseyBase64 = teamFormData.awayJersey
        ? await fileToBase64(teamFormData.awayJersey)
        : null;

      const playersDTO: PlayerDTO[] = players.map((p) => ({
        id: p.id,
        name: p.name,
        studentId: p.studentId,
        jerseyNumber: p.jerseyNumber,
        photo: p.photo,
      }));

      const teamDTO: TeamDTO = {
        teamName: teamFormData.teamName,
        teamDoctor: teamFormData.teamDoctor,
        headCoach: teamFormData.headCoach,
        teamLeader: teamFormData.teamLeader,
        coachPhone: teamFormData.coachPhone,
        leaderPhone: teamFormData.leaderPhone,
        homeJerseyColor: teamFormData.homeJerseyColor,
        awayJerseyColor: teamFormData.awayJerseyColor,
        teamLogo: teamLogoBase64,
        homeJersey: homeJerseyBase64,
        awayJersey: awayJerseyBase64,
        players: playersDTO,
        league: teamFormData.league || undefined,
        foundedDate: teamFormData.foundedDate || undefined,
        homeStadium: teamFormData.homeStadium || undefined,
        homeCity: teamFormData.homeCity || undefined,
      };

      console.log('正在提交球队数据到后端:', teamDTO);
      const response = await teamApi.create(teamDTO);

      if (response.success) {
        const savedData = response.data;
        const team: Team = {
          id: savedData.id || generateId(),
          teamName: savedData.teamName,
          teamDoctor: savedData.teamDoctor,
          headCoach: savedData.headCoach,
          teamLeader: savedData.teamLeader,
          coachPhone: savedData.coachPhone,
          leaderPhone: savedData.leaderPhone,
          homeJerseyColor: savedData.homeJerseyColor,
          awayJerseyColor: savedData.awayJerseyColor,
          teamLogo: savedData.teamLogo || null,
          homeJersey: savedData.homeJersey || null,
          awayJersey: savedData.awayJersey || null,
          players: savedData.players.map((p) => ({
            id: p.id || generateId(),
            name: p.name,
            studentId: p.studentId,
            jerseyNumber: p.jerseyNumber,
            photo: p.photo || null,
          })),
          league: savedData.league,
          foundedDate: savedData.foundedDate,
          homeStadium: savedData.homeStadium,
          homeCity: savedData.homeCity,
        };

        setSavedTeam(team);
        setIsSaved(true);
        setError(null);

        setTimeout(() => {
          setIsSaved(false);
        }, 3000);

        console.log('球队信息已成功保存到后端:', team);
      } else {
        console.error('后端返回保存失败:', response.message);
        setError(response.message || '保存失败，后端处理异常');
      }
    } catch (err) {
      console.error('保存球队信息失败:', err);
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          setError('网络连接失败，请检查网络或稍后重试');
        } else if (err.message.includes('400')) {
          setError('请求参数错误，请检查表单数据是否完整');
        } else if (err.message.includes('401')) {
          setError('未授权访问，请先登录');
        } else if (err.message.includes('500')) {
          setError('服务器内部错误，请稍后重试');
        } else {
          setError('保存失败: ' + err.message);
        }
      } else {
        setError('保存失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJson = () => {
    if (!savedTeam) {
      setError('请先保存球队信息');
      return;
    }

    const dataStr = JSON.stringify(savedTeam, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${savedTeam.teamName}_球队信息.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!savedTeam) {
      setError('请先保存球队信息');
      return;
    }

    const teamInfo = [
      { '信息类型': '队伍名称', '内容': savedTeam.teamName },
      { '信息类型': '所属联赛', '内容': savedTeam.league || '-' },
      { '信息类型': '成立时间', '内容': savedTeam.foundedDate || '-' },
      { '信息类型': '所在城市', '内容': savedTeam.homeCity || '-' },
      { '信息类型': '主场场馆', '内容': savedTeam.homeStadium || '-' },
      { '信息类型': '队医姓名', '内容': savedTeam.teamDoctor },
      { '信息类型': '主教练姓名', '内容': savedTeam.headCoach },
      { '信息类型': '领队姓名', '内容': savedTeam.teamLeader },
      { '信息类型': '主教练联系方式', '内容': savedTeam.coachPhone },
      { '信息类型': '领队联系方式', '内容': savedTeam.leaderPhone },
      { '信息类型': '主队球衣颜色', '内容': savedTeam.homeJerseyColor },
      { '信息类型': '客队球衣颜色', '内容': savedTeam.awayJerseyColor },
    ];

    const playerData = savedTeam.players.map((player) => ({
      '姓名': player.name,
      '学号': player.studentId,
      '球衣号码': player.jerseyNumber,
    }));

    const workbook = XLSX.utils.book_new();
    
    const teamSheet = XLSX.utils.json_to_sheet(teamInfo);
    XLSX.utils.book_append_sheet(workbook, teamSheet, '球队信息');

    const playerSheet = XLSX.utils.json_to_sheet(playerData);
    XLSX.utils.book_append_sheet(workbook, playerSheet, '球员名单');

    XLSX.writeFile(workbook, `${savedTeam.teamName}_球队信息.xlsx`);
  };

  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Trophy className="trophy-icon" />
            校园足球比赛球队信息录入系统
          </h1>
          <p>录入球队信息和参赛队员资料</p>
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
          <TeamForm data={teamFormData} onChange={setTeamFormData} />
        </div>

        <div className="player-section">
          <PlayerList
            players={players}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onUpdatePlayer={handleUpdatePlayer}
          />
        </div>

        <div className="importer-section">
          <ExcelImporter onImport={handleImportPlayers} />
        </div>
      </main>

      <footer className="page-footer">
        <div className="footer-actions">
          <button onClick={handleExportExcel} className="export-btn">
            <Download size={18} />
            导出为 Excel
          </button>
          <button onClick={handleExportJson} className="export-btn">
            <FileJson size={18} />
            导出为 JSON
          </button>
          <button 
            onClick={handleSave} 
            className="save-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="loader" />
                保存中...
              </>
            ) : (
              <>
                <Save size={18} />
                保存球队信息
              </>
            )}
          </button>
        </div>
        {isSaved && (
          <div className="save-success">
            <CheckCircle size={20} />
            保存成功！数据已持久化到数据库
          </div>
        )}
      </footer>
    </div>
  );
};

export default TeamInfoPage;

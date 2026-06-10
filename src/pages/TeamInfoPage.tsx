import React, { useState } from 'react';
import { Save, Download, CheckCircle, Trophy, FileJson } from 'lucide-react';
import * as XLSX from 'xlsx';
import TeamForm from '../components/TeamForm';
import PlayerList from '../components/PlayerList';
import ExcelImporter from '../components/ExcelImporter';
import { Team, TeamFormData, Player } from '../types';
import { generateId, fileToBase64 } from '../utils';

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
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [savedTeam, setSavedTeam] = useState<Team | null>(null);

  const handleAddPlayer = (player: Omit<Player, 'id'>) => {
    setPlayers((prev) => [...prev, { ...player, id: generateId() }]);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleImportPlayers = (importedPlayers: Omit<Player, 'id'>[]) => {
    const newPlayers = importedPlayers.map((p) => ({ ...p, id: generateId() }));
    setPlayers((prev) => [...prev, ...newPlayers]);
  };

  const handleSave = async () => {
    const teamLogoBase64 = teamFormData.teamLogo
      ? await fileToBase64(teamFormData.teamLogo)
      : null;
    const homeJerseyBase64 = teamFormData.homeJersey
      ? await fileToBase64(teamFormData.homeJersey)
      : null;
    const awayJerseyBase64 = teamFormData.awayJersey
      ? await fileToBase64(teamFormData.awayJersey)
      : null;

    const team: Team = {
      id: generateId(),
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
      players: players,
    };

    setSavedTeam(team);
    setIsSaved(true);

    setTimeout(() => {
      setIsSaved(false);
    }, 3000);

    console.log('球队信息已保存:', team);
  };

  const handleExportJson = () => {
    if (!savedTeam) {
      alert('请先保存球队信息');
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
      alert('请先保存球队信息');
      return;
    }

    const teamInfo = [
      { '信息类型': '队伍名称', '内容': savedTeam.teamName },
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
          <button onClick={handleSave} className="save-btn">
            <Save size={18} />
            保存球队信息
          </button>
        </div>
        {isSaved && (
          <div className="save-success">
            <CheckCircle size={20} />
            保存成功！
          </div>
        )}
      </footer>
    </div>
  );
};

export default TeamInfoPage;

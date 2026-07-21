import React, { useEffect, useState } from 'react';
import { Save, Download, Trophy, FileJson, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import TeamForm from './components/TeamForm';
import PlayerList from './components/PlayerList';
import ExcelImporter from '../../components/ExcelImporter';
import SuccessToast from '../../components/SuccessToast';
import { Team, TeamFormData, Player } from '../../types';
import { generateId } from '../../utils';
import { seasonApi } from '../../api/service';
import { SeasonDTO } from '../../api/types';
import { useAuth } from '../../contexts/AuthContext';
import {
  createTeam,
  getCompatibleActiveSeasons,
  selectActiveSeasonId,
  validateTeamCreation,
} from '../team-create';

const TeamEntryPage: React.FC = () => {
  const { user } = useAuth();
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
    gender: 'MALE',
    seasonId: '',
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [activeSeasons, setActiveSeasons] = useState<SeasonDTO[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTeam, setSavedTeam] = useState<Team | null>(null);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    seasonApi.getAll()
      .then((seasons) => {
        if (!cancelled) {
          setActiveSeasons(seasons.filter((season) => season.status === 'active'));
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : '未知错误';
          setError(`加载活跃赛季失败：${message}`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const compatibleActiveSeasons = getCompatibleActiveSeasons(
    activeSeasons,
    teamFormData.gender,
  );

  useEffect(() => {
    setTeamFormData((previous) => {
      const seasonId = selectActiveSeasonId(
        activeSeasons,
        previous.gender,
        previous.seasonId,
      );
      if (seasonId === previous.seasonId) {
        return previous;
      }
      return { ...previous, seasonId };
    });
  }, [activeSeasons, teamFormData.gender]);

  const handleAddPlayer = (player: Omit<Player, 'id'>) => {
    const sId = String(player.studentId).trim();
    const jNum = String(player.jerseyNumber).trim();
    if (players.some((p) => p.studentId === sId)) {
      setError(`已存在学号为 ${sId} 的球员`);
      return;
    }
    if (players.some((p) => p.jerseyNumber === jNum)) {
      setError(`球衣号码 ${jNum} 在本队中已被占用`);
      return;
    }
    setPlayers((prev) => [...prev, { ...player, studentId: sId, jerseyNumber: jNum, id: generateId() }]);
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
    const mergedPlayers = [...players];
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
        id: generateId()
      });
    }

    setPlayers(mergedPlayers);
    setError(null);

    if (studentIdDupCount > 0 || jerseyNumDupCount > 0) {
      let msg = `成功导入 ${importedPlayers.length - studentIdDupCount - jerseyNumDupCount} 名球员。`;
      if (studentIdDupCount > 0) msg += `跳过了 ${studentIdDupCount} 名学号重复的球员。`;
      if (jerseyNumDupCount > 0) msg += `跳过了 ${jerseyNumDupCount} 名球衣号码重复的球员。`;
      alert(msg);
    } else {
      alert(`成功导入 ${importedPlayers.length} 名球员`);
    }
  };

  const validateForm = (): boolean => {
    const validationError = validateTeamCreation(teamFormData, players);
    setError(validationError);
    return validationError === null;
  };

  const handleSave = async () => {
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const team = await createTeam(teamFormData, players, setSaveProgress);

      setSavedTeam(team);
      setIsSaved(true);
      setError(null);

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (err) {
      console.error('保存球队信息失败:', err);
      if (err instanceof Error) {
        setError('保存失败: ' + err.message);
      } else {
        setError('保存失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
      setSaveProgress(null);
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
      { '信息类型': '队医姓名', '内容': savedTeam.teamDoctor },
      { '信息类型': '主教练姓名', '内容': savedTeam.headCoach },
      { '信息类型': '领队姓名', '内容': savedTeam.teamLeader },
      { '信息类型': '主教练联系方式', '内容': savedTeam.coachPhone },
      { '信息类型': '领队联系方式', '内容': savedTeam.leaderPhone },
      { '信息类型': '主队球衣颜色', '内容': savedTeam.homeJerseyColor },
      { '信息类型': '客队球衣颜色', '内容': savedTeam.awayJerseyColor },
    ];

    const playerData = savedTeam.players?.map((player) => ({
      '姓名': player.name,
      '学号': player.studentId,
      '球衣号码': player.jerseyNumber,
    })) || [];

    const workbook = XLSX.utils.book_new();
    
    const teamSheet = XLSX.utils.json_to_sheet(teamInfo);
    XLSX.utils.book_append_sheet(workbook, teamSheet, '球队信息');

    const playerSheet = XLSX.utils.json_to_sheet(playerData);
    XLSX.utils.book_append_sheet(workbook, playerSheet, '球员名单');

    XLSX.writeFile(workbook, `${savedTeam.teamName}_球队信息.xlsx`);
  };

  if (user && user.role === 'coach' && user.teamId) {
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
          <div className="error-message" style={{ margin: '40px auto', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', textAlign: 'center', padding: '30px', background: '#fff', border: '1px solid #e9ecef', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <AlertCircle size={48} color="#e67e22" style={{ stroke: '#e67e22' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginTop: '10px' }}>您已拥有绑定的球队</h2>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
              系统检测到您已分配或注册了所辖球队。如需修改球员名单、球衣颜色、联系方式或日常名单维护，请直接前往左侧导航的 <strong>【球队信息管理】</strong> 菜单。
            </p>
          </div>
        </main>
      </div>
    );
  }

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
        {isSaved && <SuccessToast message="球队信息录入成功！" />}

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="form-section">
          <TeamForm
            data={teamFormData}
            onChange={setTeamFormData}
            activeSeasons={compatibleActiveSeasons}
          />
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
      </footer>

      {saveProgress && (
        <div className="progress-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div className="progress-card" style={{
            backgroundColor: '#ffffff',
            padding: '24px 32px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#333' }}>
              正在同步球队与球员数据...
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
              {saveProgress.message} ({saveProgress.current}/{saveProgress.total})
            </p>
            <div className="progress-bar-container" style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '8px',
            }}>
              <div className="progress-bar-fill" style={{
                width: `${(saveProgress.current / saveProgress.total) * 100}%`,
                height: '100%',
                backgroundColor: '#3b5bdb',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: '12px', color: '#868e96' }}>
              请勿关闭或刷新页面
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamEntryPage;

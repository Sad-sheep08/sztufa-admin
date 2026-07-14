import React, { useState } from 'react';
import { Save, Download, CheckCircle, Trophy, FileJson, Loader2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import TeamForm from '../components/TeamForm';
import PlayerList from '../components/PlayerList';
import ExcelImporter from '../components/ExcelImporter';
import { Team, TeamFormData, Player } from '../types';
import { generateId, fileToBase64 } from '../utils';
import { teamApi, playerApi, uploadApi } from '../api/service';
import { TeamDTO, PlayerDTO } from '../api/types';
import { useAuth } from '../contexts/AuthContext';

const TeamInfoPage: React.FC = () => {
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
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTeam, setSavedTeam] = useState<Team | null>(null);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number; message: string } | null>(null);

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

    // 计算总步骤（1个球队创建，以及多个球员创建）
    const totalSteps = 1 + players.length;
    let currentStep = 0;

    try {
      setSaveProgress({ current: currentStep, total: totalSteps, message: '正在上传图片并准备数据...' });

      // 第一步：将图片上传到 Cloudflare R2
      let teamLogoUrl: string | null = null;
      let homeJerseyUrl: string | null = null;
      let awayJerseyUrl: string | null = null;

      if (teamFormData.teamLogo) {
        const uploadRes = await uploadApi.upload(teamFormData.teamLogo);
        if (uploadRes.data && uploadRes.data.url) {
          teamLogoUrl = uploadRes.data.url;
        }
      }
      if (teamFormData.homeJersey) {
        const uploadRes = await uploadApi.upload(teamFormData.homeJersey);
        if (uploadRes.data && uploadRes.data.url) {
          homeJerseyUrl = uploadRes.data.url;
        }
      }
      if (teamFormData.awayJersey) {
        const uploadRes = await uploadApi.upload(teamFormData.awayJersey);
        if (uploadRes.data && uploadRes.data.url) {
          awayJerseyUrl = uploadRes.data.url;
        }
      }

      setSaveProgress({ current: currentStep, total: totalSteps, message: '正在向数据库创建球队信息...' });

      // 第二步：准备球队数据（不包含players，因为需要先创建球队获取ID）
      const teamDTO: TeamDTO = {
        teamName: teamFormData.teamName,
        teamDoctor: teamFormData.teamDoctor,
        headCoach: teamFormData.headCoach,
        teamLeader: teamFormData.teamLeader,
        coachPhone: teamFormData.coachPhone,
        leaderPhone: teamFormData.leaderPhone,
        homeJerseyColor: teamFormData.homeJerseyColor,
        awayJerseyColor: teamFormData.awayJerseyColor,
        teamLogo: teamLogoUrl,
        homeJersey: homeJerseyUrl,
        awayJersey: awayJerseyUrl,
      };

      console.log('正在提交球队数据到后端:', teamDTO);
      
      // 第三步：创建球队
      const savedTeamData = await teamApi.create(teamDTO);
      const teamId = savedTeamData.id;
      currentStep++;

      console.log('球队创建成功，球队ID:', teamId);

      // 第四步：为每个球员创建记录
      const savedPlayers: Player[] = [];
      try {
        for (const player of players) {
          setSaveProgress({
            current: currentStep,
            total: totalSteps,
            message: `正在添加球员: ${player.name} (学号 ${player.studentId})...`
          });
          const playerDTO: PlayerDTO = {
            name: player.name,
            studentId: player.studentId,
            jerseyNumber: player.jerseyNumber,
            photo: player.photo,
            teamId: teamId || '',
          };

          console.log('正在创建球员:', playerDTO);
          const savedPlayerData = await playerApi.create(playerDTO);
          
          savedPlayers.push({
            id: savedPlayerData.id || generateId(),
            name: savedPlayerData.name,
            studentId: savedPlayerData.studentId,
            jerseyNumber: savedPlayerData.jerseyNumber,
            photo: savedPlayerData.photo || null,
            teamId: savedPlayerData.teamId || '',
          });
          currentStep++;
        }
      } catch (playerErr) {
        console.error('创建球员失败，正在清理删除刚才创建的球队:', teamId);
        if (teamId) {
          try {
            await teamApi.delete(teamId);
          } catch (deleteErr) {
            console.error('清理删除球队失败:', deleteErr);
          }
        }
        throw playerErr;
      }

      setSaveProgress({
        current: totalSteps,
        total: totalSteps,
        message: '同步完成！正在重新渲染...'
      });

      console.log('所有球员创建成功，共', savedPlayers.length, '名球员');

      // 第五步：构建完整的球队对象
      const team: Team = {
        id: teamId || generateId(),
        teamName: savedTeamData.teamName,
        teamDoctor: savedTeamData.teamDoctor,
        headCoach: savedTeamData.headCoach,
        teamLeader: savedTeamData.teamLeader,
        coachPhone: savedTeamData.coachPhone,
        leaderPhone: savedTeamData.leaderPhone,
        homeJerseyColor: savedTeamData.homeJerseyColor,
        awayJerseyColor: savedTeamData.awayJerseyColor,
        teamLogo: savedTeamData.teamLogo || null,
        homeJersey: savedTeamData.homeJersey || null,
        awayJersey: savedTeamData.awayJersey || null,
        players: savedPlayers,
      };

      setSavedTeam(team);
      setIsSaved(true);
      setError(null);

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);

      console.log('球队信息和球员数据已成功保存到后端:', team);
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

export default TeamInfoPage;

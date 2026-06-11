import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Save, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Goal, MatchFormData, Match } from '../types';
import { generateId } from '../utils';
import { matchApi, teamApi, playerApi } from '../api/service';
import { MatchDTO, TeamDTO, PlayerDTO } from '../api/types';

const TeamManagementPage: React.FC = () => {
  const [formData, setFormData] = useState<MatchFormData>({
    matchName: '',
    matchTime: '',
    homeTeamName: '',
    awayTeamName: '',
    homeTeamScore: '',
    awayTeamScore: '',
    homeTeamGoals: [],
    awayTeamGoals: [],
    homeTeamId: '',
    awayTeamId: '',
    matchDate: '',
    location: '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingTeams, setIsVerifyingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMatch, setSavedMatch] = useState<Match | null>(null);
  const [availableTeams, setAvailableTeams] = useState<TeamDTO[]>([]);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<PlayerDTO[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<PlayerDTO[]>([]);

  const loadTeams = async () => {
    try {
      const response = await teamApi.getAll();
      setAvailableTeams(response.data);
    } catch (err) {
      console.error('加载球队列表失败:', err);
    }
  };

  const loadTeamPlayers = async (teamId: string, teamType: 'home' | 'away') => {
    if (!teamId) return;
    try {
      const response = await playerApi.getAll(1, 100, teamId);
      if (teamType === 'home') {
        setHomeTeamPlayers(response.data);
      } else {
        setAwayTeamPlayers(response.data);
      }
    } catch (err) {
      console.error('加载球队球员失败:', err);
    }
  };

  React.useEffect(() => {
    loadTeams();
  }, []);

  const addGoal = (team: 'home' | 'away') => {
    const newGoal: Goal = {
      playerName: '',
      goalTime: '',
      jerseyNumber: '',
    };
    if (team === 'home') {
      setFormData({
        ...formData,
        homeTeamGoals: [...formData.homeTeamGoals, newGoal],
      });
    } else {
      setFormData({
        ...formData,
        awayTeamGoals: [...formData.awayTeamGoals, newGoal],
      });
    }
    setError(null);
  };

  const handlePlayerSelect = (team: 'home' | 'away', index: number, playerId: string) => {
    const players = team === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);
    
    if (team === 'home') {
      const updatedGoals = [...formData.homeTeamGoals];
      updatedGoals[index] = {
        ...updatedGoals[index],
        playerName: player?.name || '',
        jerseyNumber: player?.jerseyNumber || '',
      };
      setFormData({ ...formData, homeTeamGoals: updatedGoals });
    } else {
      const updatedGoals = [...formData.awayTeamGoals];
      updatedGoals[index] = {
        ...updatedGoals[index],
        playerName: player?.name || '',
        jerseyNumber: player?.jerseyNumber || '',
      };
      setFormData({ ...formData, awayTeamGoals: updatedGoals });
    }
    setError(null);
  };

  const removeGoal = (team: 'home' | 'away', index: number) => {
    if (team === 'home') {
      setFormData({
        ...formData,
        homeTeamGoals: formData.homeTeamGoals.filter((_, i) => i !== index),
      });
    } else {
      setFormData({
        ...formData,
        awayTeamGoals: formData.awayTeamGoals.filter((_, i) => i !== index),
      });
    }
    setError(null);
  };

  const updateGoal = (team: 'home' | 'away', index: number, field: keyof Goal, value: string) => {
    if (team === 'home') {
      const updatedGoals = [...formData.homeTeamGoals];
      updatedGoals[index] = { ...updatedGoals[index], [field]: value };
      setFormData({ ...formData, homeTeamGoals: updatedGoals });
    } else {
      const updatedGoals = [...formData.awayTeamGoals];
      updatedGoals[index] = { ...updatedGoals[index], [field]: value };
      setFormData({ ...formData, awayTeamGoals: updatedGoals });
    }
    setError(null);
  };

  const validateTeamId = async (teamId: string): Promise<boolean> => {
    if (!teamId.trim()) {
      return true;
    }
    try {
      await teamApi.getById(teamId);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    if (!formData.matchName.trim()) {
      setError('请选择比赛名称');
      return false;
    }
    if (!formData.matchTime.trim()) {
      setError('请选择比赛时间');
      return false;
    }
    if (!formData.homeTeamName.trim()) {
      setError('请输入主队名称');
      return false;
    }
    if (!formData.awayTeamName.trim()) {
      setError('请输入客队名称');
      return false;
    }
    if (formData.homeTeamName === formData.awayTeamName) {
      setError('主队和客队不能相同');
      return false;
    }
    if (!formData.location.trim()) {
      setError('请输入比赛地点');
      return false;
    }
    if (!formData.homeTeamScore.trim()) {
      setError('请输入主队得分');
      return false;
    }
    if (!formData.awayTeamScore.trim()) {
      setError('请输入客队得分');
      return false;
    }

    const homeScore = parseInt(formData.homeTeamScore);
    const awayScore = parseInt(formData.awayTeamScore);

    if (isNaN(homeScore) || homeScore < 0) {
      setError('主队得分必须是非负整数');
      return false;
    }
    if (isNaN(awayScore) || awayScore < 0) {
      setError('客队得分必须是非负整数');
      return false;
    }

    const homeGoalsCount = formData.homeTeamGoals.length;
    const awayGoalsCount = formData.awayTeamGoals.length;

    if (homeScore !== homeGoalsCount) {
      setError(`主队进球数(${homeGoalsCount})与得分(${homeScore})不一致`);
      return false;
    }
    if (awayScore !== awayGoalsCount) {
      setError(`客队进球数(${awayGoalsCount})与得分(${awayScore})不一致`);
      return false;
    }

    for (const goal of formData.homeTeamGoals) {
      if (!goal.playerName.trim()) {
        setError('请填写所有主队进球球员姓名');
        return false;
      }
      if (!goal.goalTime.trim()) {
        setError('请填写所有主队进球时间');
        return false;
      }
    }

    for (const goal of formData.awayTeamGoals) {
      if (!goal.playerName.trim()) {
        setError('请填写所有客队进球球员姓名');
        return false;
      }
      if (!goal.goalTime.trim()) {
        setError('请填写所有客队进球时间');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (formData.homeTeamId.trim()) {
        setIsVerifyingTeams(true);
        const homeTeamValid = await validateTeamId(formData.homeTeamId);
        if (!homeTeamValid) {
          setError(`主队ID ${formData.homeTeamId} 不存在，请检查或使用球队名称`);
          setIsLoading(false);
          setIsVerifyingTeams(false);
          return;
        }
      }

      if (formData.awayTeamId.trim()) {
        const awayTeamValid = await validateTeamId(formData.awayTeamId);
        if (!awayTeamValid) {
          setError(`客队ID ${formData.awayTeamId} 不存在，请检查或使用球队名称`);
          setIsLoading(false);
          setIsVerifyingTeams(false);
          return;
        }
      }
      setIsVerifyingTeams(false);

      const matchDate = new Date(formData.matchTime).toISOString();

      const matchDTO: MatchDTO = {
        homeTeamId: formData.homeTeamId,
        awayTeamId: formData.awayTeamId,
        homeScore: parseInt(formData.homeTeamScore) || 0,
        awayScore: parseInt(formData.awayTeamScore) || 0,
        matchDate: matchDate,
        location: formData.location,
        status: 'finished',
      };

      console.log('正在提交比赛数据到后端:', matchDTO);
      const response = await matchApi.create(matchDTO);

      const savedData = response;
      const match: Match = {
        id: savedData.id || generateId(),
        matchName: `${savedData.homeTeam?.teamName || '主队'} vs ${savedData.awayTeam?.teamName || '客队'}`,
        matchTime: savedData.matchDate,
        homeScore: savedData.homeScore,
        awayScore: savedData.awayScore,
        homeTeamGoals: [],
        awayTeamGoals: [],
        homeTeamId: savedData.homeTeamId,
        awayTeamId: savedData.awayTeamId,
        homeTeamName: savedData.homeTeam?.teamName,
        awayTeamName: savedData.awayTeam?.teamName,
        location: savedData.location,
        status: savedData.status || 'finished',
      };

      setSavedMatch(match);
      setIsSaved(true);
      setError(null);

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);

      console.log('比赛信息已成功保存到后端:', match);
    } catch (err) {
      console.error('保存比赛信息失败:', err);
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          setError('网络连接失败，请检查网络或稍后重试');
        } else if (err.message.includes('400')) {
          setError('请求参数错误，请检查表单数据是否完整');
        } else if (err.message.includes('401')) {
          setError('未授权访问，请先登录');
        } else if (err.message.includes('404')) {
          setError('关联的球队不存在，请检查球队ID');
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
      setIsVerifyingTeams(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null);
  };

  const handleTeamSelect = (teamType: 'home' | 'away', team: TeamDTO) => {
    if (teamType === 'home') {
      setFormData({
        ...formData,
        homeTeamId: team.id || '',
        homeTeamName: team.teamName,
      });
      loadTeamPlayers(team.id || '', 'home');
    } else {
      setFormData({
        ...formData,
        awayTeamId: team.id || '',
        awayTeamName: team.teamName,
      });
      loadTeamPlayers(team.id || '', 'away');
    }
    setError(null);
  };

  return (
    <div className="match-entry-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Calendar className="trophy-icon" />
            比赛信息录入
          </h1>
          <p>录入比赛时间、比分及进球球员信息</p>
        </div>
      </header>

      <main className="page-content">
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2 className="form-title">
              <span className="icon">⚽</span>
              基本信息
            </h2>
            <div className="form-row">
              <div className="form-group">
                <label>比赛名称</label>
                <select
                  name="matchName"
                  value={formData.matchName}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">请选择比赛名称</option>
                  <option value="小组赛第一轮">小组赛第一轮</option>
                  <option value="小组赛第二轮">小组赛第二轮</option>
                  <option value="小组赛第三轮">小组赛第三轮</option>
                  <option value="八分之一决赛">八分之一决赛</option>
                  <option value="四分之一决赛">四分之一决赛</option>
                  <option value="半决赛">半决赛</option>
                  <option value="季军赛">季军赛</option>
                  <option value="决赛">决赛</option>
                </select>
              </div>

              <div className="form-group">
                <label>比赛时间</label>
                <input
                  type="datetime-local"
                  name="matchTime"
                  value={formData.matchTime}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>比赛地点</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="请输入比赛地点"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-title">
              <span className="icon">🏆</span>
              对阵球队
            </h2>
            <div className="match-score-container">
              <div className="team-column home-team">
                <div className="team-label">主队</div>
                <div className="team-select-wrapper">
                  <select
                    value={formData.homeTeamId}
                    onChange={(e) => {
                      const team = availableTeams.find(t => t.id === e.target.value);
                      if (team) {
                        handleTeamSelect('home', team);
                      } else {
                        setFormData({ ...formData, homeTeamId: e.target.value });
                      }
                    }}
                    className="form-select team-select"
                  >
                    <option value="">选择已有球队</option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id || ''}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="team-input-wrapper">
                  <input
                    type="text"
                    name="homeTeamName"
                    value={formData.homeTeamName}
                    onChange={handleChange}
                    className="form-input team-name-input"
                    placeholder="主队名称"
                    required
                  />
                </div>
                <div className="team-id-wrapper">
                  <input
                    type="text"
                    name="homeTeamId"
                    value={formData.homeTeamId}
                    onChange={handleChange}
                    className="form-input team-id-input"
                    placeholder="主队ID（可选）"
                  />
                </div>
                <div className="score-input-wrapper">
                  <input
                    type="number"
                    name="homeTeamScore"
                    value={formData.homeTeamScore}
                    onChange={handleChange}
                    className="form-input score-input"
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="vs-divider">
                <div className="vs-circle">
                  <span className="vs-text">VS</span>
                </div>
              </div>

              <div className="team-column away-team">
                <div className="team-label">客队</div>
                <div className="team-select-wrapper">
                  <select
                    value={formData.awayTeamId}
                    onChange={(e) => {
                      const team = availableTeams.find(t => t.id === e.target.value);
                      if (team) {
                        handleTeamSelect('away', team);
                      } else {
                        setFormData({ ...formData, awayTeamId: e.target.value });
                      }
                    }}
                    className="form-select team-select"
                  >
                    <option value="">选择已有球队</option>
                    {availableTeams.map((team) => (
                      <option key={team.id} value={team.id || ''}>
                        {team.teamName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="team-input-wrapper">
                  <input
                    type="text"
                    name="awayTeamName"
                    value={formData.awayTeamName}
                    onChange={handleChange}
                    className="form-input team-name-input"
                    placeholder="客队名称"
                    required
                  />
                </div>
                <div className="team-id-wrapper">
                  <input
                    type="text"
                    name="awayTeamId"
                    value={formData.awayTeamId}
                    onChange={handleChange}
                    className="form-input team-id-input"
                    placeholder="客队ID（可选）"
                  />
                </div>
                <div className="score-input-wrapper">
                  <input
                    type="number"
                    name="awayTeamScore"
                    value={formData.awayTeamScore}
                    onChange={handleChange}
                    className="form-input score-input"
                    min="0"
                    required
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h2 className="form-title">
                <span className="icon">👕</span>
                主队进球记录
              </h2>
              <button
                type="button"
                onClick={() => addGoal('home')}
                className="add-btn"
              >
                <Plus size={16} />
                添加进球
              </button>
            </div>
            {formData.homeTeamGoals.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} />
                <p>暂无进球记录，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="player-table-wrapper">
                <table className="player-table">
                  <thead>
                    <tr>
                      <th>进球球员</th>
                      <th>进球时间</th>
                      <th>球衣号码</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.homeTeamGoals.map((goal, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            value={homeTeamPlayers.find(p => p.name === goal.playerName)?.id || ''}
                            onChange={(e) => handlePlayerSelect('home', index, e.target.value)}
                            className="form-select inline"
                            required
                          >
                            <option value="">请选择球员</option>
                            {homeTeamPlayers.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={goal.goalTime}
                            onChange={(e) => updateGoal('home', index, 'goalTime', e.target.value)}
                            className="form-input inline"
                            placeholder="如：35'"
                            required
                          />
                        </td>
                        <td>
                          <div className="form-value inline">
                            {goal.jerseyNumber || '-'}
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeGoal('home', index)}
                            className="delete-btn"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="form-section">
            <div className="section-header">
              <h2 className="form-title">
                <span className="icon">👚</span>
                客队进球记录
              </h2>
              <button
                type="button"
                onClick={() => addGoal('away')}
                className="add-btn"
              >
                <Plus size={16} />
                添加进球
              </button>
            </div>
            {formData.awayTeamGoals.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} />
                <p>暂无进球记录，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="player-table-wrapper">
                <table className="player-table">
                  <thead>
                    <tr>
                      <th>进球球员</th>
                      <th>进球时间</th>
                      <th>球衣号码</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.awayTeamGoals.map((goal, index) => (
                      <tr key={index}>
                        <td>
                          <select
                            value={awayTeamPlayers.find(p => p.name === goal.playerName)?.id || ''}
                            onChange={(e) => handlePlayerSelect('away', index, e.target.value)}
                            className="form-select inline"
                            required
                          >
                            <option value="">请选择球员</option>
                            {awayTeamPlayers.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={goal.goalTime}
                            onChange={(e) => updateGoal('away', index, 'goalTime', e.target.value)}
                            className="form-input inline"
                            placeholder="如：35'"
                            required
                          />
                        </td>
                        <td>
                          <div className="form-value inline">
                            {goal.jerseyNumber || '-'}
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeGoal('away', index)}
                            className="delete-btn"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </form>
      </main>

      <footer className="page-footer">
        <div className="footer-actions">
          <button 
            onClick={handleSubmit} 
            className="save-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="loader" />
                {isVerifyingTeams ? '验证球队信息中...' : '保存中...'}
              </>
            ) : (
              <>
                <Save size={18} />
                保存比赛信息
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

export default TeamManagementPage;

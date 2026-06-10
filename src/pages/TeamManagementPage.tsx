import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import { Goal, MatchFormData, Match } from '../types';
import { generateId } from '../utils';

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
  });

  const [isSaved, setIsSaved] = useState(false);
  const [savedMatch, setSavedMatch] = useState<Match | null>(null);

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const match: Match = {
      id: generateId(),
      matchName: formData.matchName,
      matchTime: formData.matchTime,
      homeTeamScore: parseInt(formData.homeTeamScore),
      awayTeamScore: parseInt(formData.awayTeamScore),
      homeTeamGoals: formData.homeTeamGoals,
      awayTeamGoals: formData.awayTeamGoals,
    };

    setSavedMatch(match);
    setIsSaved(true);

    setTimeout(() => {
      setIsSaved(false);
    }, 3000);

    console.log('比赛信息已保存:', match);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-title">
              <span className="icon">🏆</span>
              比赛比分
            </h2>
            <div className="match-score-container">
              <div className="team-column home-team">
                <div className="team-label">主队</div>
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
                          <input
                            type="text"
                            value={goal.playerName}
                            onChange={(e) => updateGoal('home', index, 'playerName', e.target.value)}
                            className="form-input inline"
                            placeholder="进球球员"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={goal.goalTime}
                            onChange={(e) => updateGoal('home', index, 'goalTime', e.target.value)}
                            className="form-input inline"
                            placeholder="如: 35'"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={goal.jerseyNumber}
                            onChange={(e) => updateGoal('home', index, 'jerseyNumber', e.target.value)}
                            className="form-input inline"
                            placeholder="球衣号码"
                            required
                          />
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
                          <input
                            type="text"
                            value={goal.playerName}
                            onChange={(e) => updateGoal('away', index, 'playerName', e.target.value)}
                            className="form-input inline"
                            placeholder="进球球员"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={goal.goalTime}
                            onChange={(e) => updateGoal('away', index, 'goalTime', e.target.value)}
                            className="form-input inline"
                            placeholder="如: 35'"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={goal.jerseyNumber}
                            onChange={(e) => updateGoal('away', index, 'jerseyNumber', e.target.value)}
                            className="form-input inline"
                            placeholder="球衣号码"
                            required
                          />
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
          <button onClick={handleSubmit} className="save-btn">
            <Save size={18} />
            保存比赛信息
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

export default TeamManagementPage;
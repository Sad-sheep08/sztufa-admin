import React from 'react';
import { MatchFormData } from '../../../types';
import { TeamDTO } from '../../../api/types';

interface TeamScoreSectionProps {
  formData: MatchFormData;
  setFormData: React.Dispatch<React.SetStateAction<MatchFormData>>;
  activeSeason: any;
  availableTeams: TeamDTO[];
  getFilteredTeams: () => TeamDTO[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleTeamSelect: (teamType: 'home' | 'away', team: TeamDTO) => void;
}

const TeamScoreSection: React.FC<TeamScoreSectionProps> = ({
  formData,
  setFormData,
  activeSeason,
  availableTeams,
  getFilteredTeams,
  handleChange,
  handleTeamSelect,
}) => {
  return (
    <>
      {activeSeason?.type === 'CUP' && (
        <div className="form-section" style={{ marginBottom: '20px' }}>
          <h2 className="form-title">
            <span className="icon">🏆</span>
            杯赛属性设置
          </h2>
          <div className="form-row">
            <div className="form-group">
              <label>比赛阶段</label>
              <select
                name="stage"
                value={formData.stage || 'GROUP'}
                onChange={(e) => {
                  const stage = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    stage,
                    groupName: stage === 'GROUP' ? 'A' : '',
                    knockoutRound: stage === 'KNOCKOUT' ? 'QF' : '',
                    knockoutMatchIndex: stage === 'KNOCKOUT' ? '1' : ''
                  }));
                }}
                className="form-select"
                required
              >
                <option value="GROUP">小组赛 (Group Stage)</option>
                <option value="KNOCKOUT">淘汰赛 (Knockout Stage)</option>
              </select>
            </div>

            {formData.stage === 'GROUP' && (
              <div className="form-group">
                <label>小组</label>
                <select
                  name="groupName"
                  value={formData.groupName || 'A'}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="A">A 组</option>
                  <option value="B">B 组</option>
                  <option value="C">C 组</option>
                  <option value="D">D 组</option>
                  <option value="E">E 组</option>
                  <option value="F">F 组</option>
                  <option value="G">G 组</option>
                  <option value="H">H 组</option>
                </select>
              </div>
            )}

            {formData.stage === 'KNOCKOUT' && (
              <>
                <div className="form-group">
                  <label>淘汰赛轮次</label>
                  <select
                    name="knockoutRound"
                    value={formData.knockoutRound || 'QF'}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="R16">1/8 决赛 (16强)</option>
                    <option value="QF">1/4 决赛 (8强)</option>
                    <option value="SF">半决赛 (4强)</option>
                    <option value="F">决赛</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>对阵序号</label>
                  <select
                    name="knockoutMatchIndex"
                    value={formData.knockoutMatchIndex || '1'}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >
                    <option value="1">对阵 #1</option>
                    <option value="2">对阵 #2</option>
                    <option value="3">对阵 #3</option>
                    <option value="4">对阵 #4</option>
                    <option value="5">对阵 #5</option>
                    <option value="6">对阵 #6</option>
                    <option value="7">对阵 #7</option>
                    <option value="8">对阵 #8</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                {getFilteredTeams().map((team) => (
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
                {getFilteredTeams().map((team) => (
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
    </>
  );
};

export default TeamScoreSection;

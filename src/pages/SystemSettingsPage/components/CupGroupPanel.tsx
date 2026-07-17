import React from 'react';
import { TeamDTO } from '../../../api/types';

interface CupGroupPanelProps {
  activeSeason: any;
  teams: TeamDTO[];
  groupsData: { teamId: string; groupName: string }[];
  isSavingGroups: boolean;
  onTeamGroupChange: (teamId: string, groupName: string) => void;
  onSaveGroups: () => void;
  onGenerateKnockout: () => void;
}

export const CupGroupPanel: React.FC<CupGroupPanelProps> = ({
  activeSeason,
  teams,
  groupsData,
  isSavingGroups,
  onTeamGroupChange,
  onSaveGroups,
  onGenerateKnockout,
}) => {
  if (!activeSeason) return null;

  return (
    <div className="form-section">
      <div className="section-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="form-title" style={{ margin: 0 }}>
          <span className="icon">🏆</span>
          本赛季分组配置 ({activeSeason.name})
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onGenerateKnockout}
            className="save-btn"
            style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 16px', margin: 0, cursor: 'pointer', fontWeight: 'bold' }}
          >
            ⚡ 一键生成淘汰赛对阵
          </button>
          <button
            onClick={onSaveGroups}
            disabled={isSavingGroups}
            className="save-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 16px', margin: 0 }}
          >
            {isSavingGroups ? '正在保存...' : '💾 保存分组配置'}
          </button>
        </div>
      </div>

      <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
          请为本届杯赛赛季的各个参赛球队划分小组。点击右上角“保存分组配置”生效。
          <br />
          <strong>提示：</strong>当小组赛比赛全部录入完赛后，可点击左侧“⚡ 一键生成淘汰赛对阵”按钮，系统将自动按积分规则计算出线名次并生成首轮淘汰赛对阵（支持 2组、4组、8组 系统交叉对决）。
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
          {teams.map(team => {
            const currentGroup = groupsData.find(g => g.teamId === team.id)?.groupName || '';
            return (
              <div
                key={team.id}
                style={{
                  padding: '12px 15px',
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {team.teamLogo ? (
                    <img src={team.teamLogo} alt={team.teamName} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>⚽</div>
                  )}
                  <span style={{ fontWeight: '500', color: '#333' }}>{team.teamName}</span>
                </div>
                <select
                  value={currentGroup}
                  onChange={(e) => onTeamGroupChange(team.id!, e.target.value)}
                  style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff', fontSize: '14px' }}
                >
                  <option value="">-- 未分配 --</option>
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

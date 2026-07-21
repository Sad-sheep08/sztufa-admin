import React from 'react';
import { CheckCircle, MapPin } from 'lucide-react';
import { Match, MatchEvent } from '../../../types';
import { PlayerDTO } from '../../../api/types';
import { MatchLineupPanel } from './MatchLineupPanel';
import { MatchEventTable } from './MatchEventTable';

interface MatchDetailPanelProps {
  selectedMatch: Match;
  isEditing: boolean;
  isSaved: boolean;
  isLoading: boolean;
  editData: Match | null;
  seasons: any[];
  selectedSeasonId: string;
  homeTeamPlayers: PlayerDTO[];
  awayTeamPlayers: PlayerDTO[];
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onFieldChange: (field: keyof Match, value: string | number) => void;
  onSetEditData: (data: Match) => void;
  onLineupChange: (playerId: string, teamType: 'home' | 'away', type: 'starting' | 'substitute' | 'none') => void;
  onEventChange: (index: number, field: keyof MatchEvent, value: any) => void;
  onEventPlayerSelect: (index: number, playerId: string) => void;
  onSubPlayerSelect: (index: number, playerId: string) => void;
  onAssistPlayerSelect: (index: number, playerId: string) => void;
  onAddEvent: (team: 'home' | 'away') => void;
  onRemoveEvent: (index: number) => void;
}

const formatMatchTime = (time: string) => {
  try {
    const date = new Date(time);
    return date.toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return time; }
};
const formatForDateTimeLocal = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const cleaned = dateStr.replace(/\//g, '-');
    const date = new Date(cleaned);
    if (isNaN(date.getTime())) return '';
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch { return ''; }
};

export const MatchDetailPanel: React.FC<MatchDetailPanelProps> = ({
  selectedMatch, isEditing, isSaved, isLoading,
  editData, seasons, selectedSeasonId,
  homeTeamPlayers, awayTeamPlayers,
  onSaveEdit, onCancelEdit, onFieldChange, onSetEditData,
  onLineupChange, onEventChange,
  onEventPlayerSelect, onSubPlayerSelect, onAssistPlayerSelect,
  onAddEvent, onRemoveEvent,
}) => {
  const currentSeason = seasons.find(s => s.id === (editData?.seasonId || selectedMatch?.seasonId || selectedSeasonId));
  const isCup = currentSeason?.type === 'CUP';

  return (
    <>
      {/* 比赛基本信息面板 */}
      <div className="form-section">
        <div className="section-header">
          <h2 className="form-title">
            <span className="icon">📋</span>
            {isEditing ? '编辑比赛信息' : `${selectedMatch.matchName} - 详细信息`}
          </h2>
          {isEditing && (
            <div className="form-actions">
              {isSaved && (
                <div className="save-success inline">
                  <CheckCircle size={18} />
                  保存成功
                </div>
              )}
              <button onClick={onSaveEdit} className="save-btn small" disabled={isLoading}>
                <CheckCircle size={16} />
                保存
              </button>
              <button onClick={onCancelEdit} className="cancel-btn">取消</button>
            </div>
          )}
        </div>

        {/* 杯赛阶段字段（仅 CUP 赛季） */}
        {isCup && (
          <div className="form-row" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '15px', marginBottom: '15px' }}>
            <div className="form-group">
              <label>比赛阶段</label>
              {isEditing ? (
                <select
                  value={editData?.stage || 'GROUP'}
                  onChange={(e) => {
                    const stage = e.target.value;
                    if (editData) {
                      onSetEditData({
                        ...editData, stage,
                        groupName: stage === 'GROUP' ? 'A' : '',
                        knockoutRound: stage === 'KNOCKOUT' ? 'QF' : '',
                        knockoutMatchIndex: stage === 'KNOCKOUT' ? 1 : undefined
                      });
                    }
                  }}
                  className="form-select"
                >
                  <option value="GROUP">小组赛 (Group Stage)</option>
                  <option value="KNOCKOUT">淘汰赛 (Knockout Stage)</option>
                </select>
              ) : (
                <div className="form-value">
                  {selectedMatch.stage === 'GROUP' ? '小组赛' : selectedMatch.stage === 'KNOCKOUT' ? '淘汰赛' : '未设定'}
                </div>
              )}
            </div>

            {(isEditing ? editData?.stage : selectedMatch.stage) === 'GROUP' && (
              <div className="form-group">
                <label>小组</label>
                {isEditing ? (
                  <select value={editData?.groupName || 'A'} onChange={(e) => onFieldChange('groupName', e.target.value)} className="form-select">
                    {['A','B','C','D','E','F','G','H'].map(g => <option key={g} value={g}>{g} 组</option>)}
                  </select>
                ) : (
                  <div className="form-value">{selectedMatch.groupName || '-'} 组</div>
                )}
              </div>
            )}

            {(isEditing ? editData?.stage : selectedMatch.stage) === 'KNOCKOUT' && (
              <>
                <div className="form-group">
                  <label>淘汰赛轮次</label>
                  {isEditing ? (
                    <select value={editData?.knockoutRound || 'QF'} onChange={(e) => onFieldChange('knockoutRound', e.target.value)} className="form-select">
                      <option value="R16">1/8 决赛 (16强)</option>
                      <option value="QF">1/4 决赛 (8强)</option>
                      <option value="SF">半决赛 (4强)</option>
                      <option value="F">决赛</option>
                    </select>
                  ) : (
                    <div className="form-value">
                      {selectedMatch.knockoutRound === 'R16' ? '1/8 决赛' : selectedMatch.knockoutRound === 'QF' ? '1/4 决赛' : selectedMatch.knockoutRound === 'SF' ? '半决赛' : selectedMatch.knockoutRound === 'F' ? '决赛' : '-'}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>对阵序号</label>
                  {isEditing ? (
                    <select value={editData?.knockoutMatchIndex || '1'} onChange={(e) => onFieldChange('knockoutMatchIndex', parseInt(e.target.value, 10))} className="form-select">
                      {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>对阵 #{n}</option>)}
                    </select>
                  ) : (
                    <div className="form-value">对阵 #{selectedMatch.knockoutMatchIndex || '-'}</div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* 基本字段 */}
        <div className="form-row">
          <div className="form-group">
            <label>比赛名称</label>
            {isEditing ? (
              <select value={editData?.matchName || ''} onChange={(e) => onFieldChange('matchName', e.target.value)} className="form-select">
                <option value="">请选择比赛名称</option>
                {['小组赛第一轮','小组赛第二轮','小组赛第三轮','八分之一决赛','四分之一决赛','半决赛','季军赛','决赛'].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            ) : (
              <div className="form-value">{selectedMatch.matchName}</div>
            )}
          </div>
          <div className="form-group">
            <label>比赛时间</label>
            {isEditing ? (
              <input type="datetime-local" value={formatForDateTimeLocal(editData?.matchTime || '')} onChange={(e) => onFieldChange('matchTime', e.target.value)} className="form-input" />
            ) : (
              <div className="form-value">{formatMatchTime(selectedMatch.matchTime)}</div>
            )}
          </div>
          <div className="form-group">
            <label>比赛地点</label>
            {isEditing ? (
              <select value={editData?.location || ''} onChange={(e) => onFieldChange('location', e.target.value)} className="form-input">
                <option value="">请选择比赛地点</option>
                <option value="五人场">五人场</option>
                <option value="北区">北区</option>
                <option value="南区">南区</option>
                {editData?.location && !['五人场', '北区', '南区'].includes(editData.location) && (
                  <option value={editData.location}>{editData.location}</option>
                )}
              </select>
            ) : (
              <div className="form-value">
                <MapPin size={14} style={{ marginRight: '6px' }} />
                {selectedMatch.location || '-'}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>全场最佳球员 (MVP)</label>
            {isEditing ? (
              <select
                value={editData?.mvpPlayerId || ''}
                onChange={(e) => {
                  const allPlayers = [...homeTeamPlayers, ...awayTeamPlayers];
                  const selected = allPlayers.find(p => p.id === e.target.value);
                  if (editData) {
                    onSetEditData({ ...editData, mvpPlayerId: selected?.id || '', mvpPlayerName: selected?.name || '' });
                  }
                }}
                className="form-select"
              >
                <option value="">请选择本场 MVP (选填)</option>
                <optgroup label={editData?.homeTeamName || '主队'}>
                  {homeTeamPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.jerseyNumber}号)</option>)}
                </optgroup>
                <optgroup label={editData?.awayTeamName || '客队'}>
                  {awayTeamPlayers.map(p => <option key={p.id} value={p.id}>{p.name} ({p.jerseyNumber}号)</option>)}
                </optgroup>
              </select>
            ) : (
              <div className="form-value" style={{ fontWeight: 'bold', color: '#f57c00' }}>
                🏆 {selectedMatch.mvpPlayerName || '未评选'}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>比赛状态</label>
            {isEditing ? (
              <select value={editData?.status || 'scheduled'} onChange={(e) => onFieldChange('status', e.target.value)} className="form-select">
                <option value="scheduled">即将开始</option>
                <option value="ongoing">进行中</option>
                <option value="finished">已结束</option>
              </select>
            ) : (
              <div className="form-value">
                {selectedMatch.status === 'scheduled' && '即将开始'}
                {selectedMatch.status === 'ongoing' && '进行中'}
                {selectedMatch.status === 'finished' && '已结束'}
              </div>
            )}
          </div>
        </div>

        {/* 比分 */}
        <div className="match-score-container">
          <div className="team-column home-team">
            <div className="team-label">主队</div>
            {isEditing ? (
              <>
                <div className="team-input-wrapper">
                  <input type="text" value={editData?.homeTeamName || ''} onChange={(e) => onFieldChange('homeTeamName', e.target.value)} className="form-input team-name-input" placeholder="主队名称" />
                </div>
                <div className="team-id-wrapper">
                  <input type="text" value={editData?.homeTeamId || ''} onChange={(e) => onFieldChange('homeTeamId', e.target.value)} className="form-input team-id-input" placeholder="主队ID（可选）" />
                </div>
              </>
            ) : (
              <>
                <div className="team-name-display">{selectedMatch.homeTeamName}</div>
                {selectedMatch.homeTeamId && <div className="team-id-display">ID: {selectedMatch.homeTeamId}</div>}
              </>
            )}
            <div className="score-input-wrapper">
              {isEditing ? (
                <input
                  type="number"
                  value={editData?.homeTeamScore || 0}
                  onChange={(e) => { const val = parseInt(e.target.value) || 0; if (editData) onSetEditData({ ...editData, homeTeamScore: val, homeScore: val }); }}
                  className="form-input score-input"
                  min="0"
                />
              ) : (
                <div className="score-value-display">{selectedMatch.homeTeamScore}</div>
              )}
            </div>
          </div>

          <div className="vs-divider">
            <div className="vs-circle"><span className="vs-text">VS</span></div>
          </div>

          <div className="team-column away-team">
            <div className="team-label">客队</div>
            {isEditing ? (
              <>
                <div className="team-input-wrapper">
                  <input type="text" value={editData?.awayTeamName || ''} onChange={(e) => onFieldChange('awayTeamName', e.target.value)} className="form-input team-name-input" placeholder="客队名称" />
                </div>
                <div className="team-id-wrapper">
                  <input type="text" value={editData?.awayTeamId || ''} onChange={(e) => onFieldChange('awayTeamId', e.target.value)} className="form-input team-id-input" placeholder="客队ID（可选）" />
                </div>
              </>
            ) : (
              <>
                <div className="team-name-display">{selectedMatch.awayTeamName}</div>
                {selectedMatch.awayTeamId && <div className="team-id-display">ID: {selectedMatch.awayTeamId}</div>}
              </>
            )}
            <div className="score-input-wrapper">
              {isEditing ? (
                <input
                  type="number"
                  value={editData?.awayTeamScore || 0}
                  onChange={(e) => { const val = parseInt(e.target.value) || 0; if (editData) onSetEditData({ ...editData, awayTeamScore: val, awayScore: val }); }}
                  className="form-input score-input"
                  min="0"
                />
              ) : (
                <div className="score-value-display">{selectedMatch.awayTeamScore}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 阵容配置面板 */}
      <div className="form-section">
        <div className="section-header">
          <h2 className="form-title">
            <span className="icon">🏃‍♂️</span>
            首发与替补名单配置
          </h2>
        </div>
        <div className="lineups-admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <MatchLineupPanel
            teamType="home"
            selectedMatch={selectedMatch}
            editData={editData}
            isEditing={isEditing}
            players={homeTeamPlayers}
            onLineupChange={onLineupChange}
          />
          <MatchLineupPanel
            teamType="away"
            selectedMatch={selectedMatch}
            editData={editData}
            isEditing={isEditing}
            players={awayTeamPlayers}
            onLineupChange={onLineupChange}
          />
        </div>
      </div>

      {/* 事件表格：主队 */}
      <MatchEventTable
        teamType="home"
        events={editData?.events || selectedMatch.events || []}
        isEditing={isEditing}
        players={homeTeamPlayers}
        onAddEvent={() => onAddEvent('home')}
        onRemoveEvent={onRemoveEvent}
        onEventChange={onEventChange}
        onEventPlayerSelect={onEventPlayerSelect}
        onSubPlayerSelect={onSubPlayerSelect}
        onAssistPlayerSelect={onAssistPlayerSelect}
      />

      {/* 事件表格：客队 */}
      <MatchEventTable
        teamType="away"
        events={editData?.events || selectedMatch.events || []}
        isEditing={isEditing}
        players={awayTeamPlayers}
        onAddEvent={() => onAddEvent('away')}
        onRemoveEvent={onRemoveEvent}
        onEventChange={onEventChange}
        onEventPlayerSelect={onEventPlayerSelect}
        onSubPlayerSelect={onSubPlayerSelect}
        onAssistPlayerSelect={onAssistPlayerSelect}
      />
    </>
  );
};

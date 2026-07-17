import React from 'react';
import { CheckCircle, MapPin, Plus, X } from 'lucide-react';
import { Match, MatchEvent } from '../../../types';
import { PlayerDTO } from '../../../api/types';

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

const EVENT_TYPE_LABELS: Record<string, string> = {
  goal: '⚽ 普通进球', penalty: '🎯 点球', own_goal: '🥅 乌龙球',
  substitution: '🔄 换人', yellow_card: '🟨 黄牌', red_card: '🟥 红牌',
  yellow_to_red: '🟨🟥 两黄变一红', penalty_shootout_goal: '🥅⚽ 点球大战进球',
  penalty_shootout_miss: '🥅❌ 点球大战飞点/罚失', penalty_miss: '❌ 常规时间点球罚失',
};

interface EventTableProps {
  teamType: 'home' | 'away';
  events: MatchEvent[];
  isEditing: boolean;
  players: PlayerDTO[];
  onAddEvent: () => void;
  onRemoveEvent: (index: number) => void;
  onEventChange: (index: number, field: keyof MatchEvent, value: any) => void;
  onEventPlayerSelect: (index: number, playerId: string) => void;
  onSubPlayerSelect: (index: number, playerId: string) => void;
  onAssistPlayerSelect: (index: number, playerId: string) => void;
}

const EventTable: React.FC<EventTableProps> = ({
  teamType, events, isEditing, players,
  onAddEvent, onRemoveEvent, onEventChange,
  onEventPlayerSelect, onSubPlayerSelect, onAssistPlayerSelect,
}) => {
  const teamEvents = events.filter(e => e.teamType === teamType);
  const label = teamType === 'home' ? '主队' : '客队';
  const icon = teamType === 'home' ? '👕' : '👚';

  if (!isEditing && teamEvents.length === 0) return null;

  return (
    <div className="form-section">
      <div className="section-header">
        <h2 className="form-title">
          <span className="icon">{icon}</span>
          {label}事件记录（进球、换人、红黄牌）
        </h2>
        {isEditing && (
          <button onClick={onAddEvent} className="add-btn small">
            <Plus size={14} />
            添加{label}事件
          </button>
        )}
      </div>
      <div className="player-table-wrapper">
        <table className="player-table events-input-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>时间</th>
              <th style={{ width: '150px' }}>事件类型</th>
              <th style={{ width: '220px' }}>球员</th>
              <th style={{ width: '120px' }}>号码</th>
              <th>事件描述</th>
              {isEditing && <th style={{ width: '60px' }}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {teamEvents.length > 0 ? (
              events.map((event, index) => {
                if (event.teamType !== teamType) return null;
                return (
                  <tr key={index}>
                    <td data-label="时间">
                      {isEditing ? (
                        <input
                          type="text"
                          value={event.eventTime || ''}
                          onChange={(e) => onEventChange(index, 'eventTime', e.target.value)}
                          className="form-input inline"
                          placeholder="如: 35'"
                          required
                        />
                      ) : (
                        <span>{event.eventTime}</span>
                      )}
                    </td>
                    <td data-label="事件类型">
                      {isEditing ? (
                        <select
                          value={event.eventType}
                          onChange={(e) => onEventChange(index, 'eventType', e.target.value as any)}
                          className="form-select inline"
                          required
                        >
                          {Object.entries(EVENT_TYPE_LABELS).map(([val, lbl]) => (
                            <option key={val} value={val}>{lbl}</option>
                          ))}
                        </select>
                      ) : (
                        <span>{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</span>
                      )}
                    </td>
                    <td data-label="球员">
                      {isEditing ? (
                        event.eventType === 'substitution' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <select
                              value={event.playerId || ''}
                              onChange={(e) => onEventPlayerSelect(index, e.target.value)}
                              className="form-select inline" required
                            >
                              <option value="">请选择换上球员</option>
                              {players.map((p) => (
                                <option key={p.id} value={p.id} style={p.status === 'suspended' ? { color: '#fa5252', fontWeight: 'bold' } : undefined}>
                                  换上: {p.name} ({p.jerseyNumber}号) {p.status === 'suspended' ? `(🛑 停赛 - 🟨${p.yellowCards} 🟥${p.redCards})` : ''}
                                </option>
                              ))}
                            </select>
                            <select
                              value={event.subPlayerId || ''}
                              onChange={(e) => onSubPlayerSelect(index, e.target.value)}
                              className="form-select inline" required
                            >
                              <option value="">请选择换下球员</option>
                              {players.map((p) => (
                                <option key={p.id} value={p.id} style={p.status === 'suspended' ? { color: '#fa5252', fontWeight: 'bold' } : undefined}>
                                  换下: {p.name} ({p.jerseyNumber}号) {p.status === 'suspended' ? `(🛑 停赛 - 🟨${p.yellowCards} 🟥${p.redCards})` : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <select
                              value={event.playerId || ''}
                              onChange={(e) => onEventPlayerSelect(index, e.target.value)}
                              className="form-select inline" required
                            >
                              <option value="">请选择球员</option>
                              {players.map((p) => (
                                <option key={p.id} value={p.id} style={p.status === 'suspended' ? { color: '#fa5252', fontWeight: 'bold' } : undefined}>
                                  {p.name} ({p.jerseyNumber}号) {p.status === 'suspended' ? `(🛑 停赛 - 🟨${p.yellowCards} 🟥${p.redCards})` : ''}
                                </option>
                              ))}
                            </select>
                            {event.eventType === 'goal' && (
                              <select
                                value={event.assistPlayerId || ''}
                                onChange={(e) => onAssistPlayerSelect(index, e.target.value)}
                                className="form-select inline"
                                style={{ marginTop: '4px', borderColor: '#b3e5fc', background: '#e1f5fe' }}
                              >
                                <option value="">请选择助攻球员 (选填)</option>
                                {players
                                  .filter(p => p.id !== event.playerId)
                                  .map((p) => (
                                    <option key={p.id} value={p.id} style={p.status === 'suspended' ? { color: '#fa5252', fontWeight: 'bold' } : undefined}>
                                      助攻: {p.name} ({p.jerseyNumber}号) {p.status === 'suspended' ? '(🛑 停赛)' : ''}
                                    </option>
                                  ))}
                              </select>
                            )}
                          </div>
                        )
                      ) : (
                        event.eventType === 'substitution' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                            <span>换上: {event.playerName}</span>
                            <span>换下: {event.subPlayerName}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{event.playerName}</span>
                            {event.assistPlayerName && (
                              <span style={{ fontSize: '0.8rem', color: '#0288d1', fontStyle: 'italic' }}>
                                助攻: {event.assistPlayerName}
                              </span>
                            )}
                          </div>
                        )
                      )}
                    </td>
                    <td data-label="号码">
                      <div className="form-value inline" style={{ fontSize: '0.85rem' }}>
                        {event.eventType === 'substitution' ? (
                          <span>上: {event.jerseyNumber || '-'} <br /> 下: {event.subJerseyNumber || '-'}</span>
                        ) : (
                          event.jerseyNumber || '-'
                        )}
                      </div>
                    </td>
                    <td data-label="事件描述">
                      {isEditing ? (
                        <input
                          type="text"
                          value={event.description || ''}
                          onChange={(e) => onEventChange(index, 'description', e.target.value)}
                          className="form-input inline"
                          placeholder={event.eventType === 'substitution' ? '选填，自动生成换人描述' : '选填，自动生成事件描述'}
                        />
                      ) : (
                        <span>{event.description || '-'}</span>
                      )}
                    </td>
                    {isEditing && (
                      <td data-label="操作">
                        <button onClick={() => onRemoveEvent(index)} className="delete-btn small">
                          <X size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : isEditing ? (
              <tr>
                <td colSpan={6} className="empty-state-cell">
                  暂无{label}事件记录，点击上方"添加{label}事件"按钮添加
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={5} className="empty-state-cell">
                  暂无{label}事件记录
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
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

  const renderLineupEditor = (teamType: 'home' | 'away') => {
    const players = teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const teamName = isEditing
      ? (teamType === 'home' ? editData?.homeTeamName : editData?.awayTeamName)
      : (teamType === 'home' ? selectedMatch.homeTeamName : selectedMatch.awayTeamName);
    const label = teamType === 'home' ? '主队' : '客队';

    return (
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #ddd', paddingBottom: '6px' }}>
          {teamName} ({label})
        </h3>
        {isEditing ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px', padding: '12px' }}>
            {players.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>暂无球员数据，请先录入名册</p>
            ) : (
              players.map(player => {
                const lineup = (editData?.lineups || []).find(l => l.playerId === player.id);
                const status = lineup ? lineup.lineupType : 'none';
                return (
                  <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f9f9f9' }}>
                    <div>
                      <span style={{ display: 'inline-block', width: '30px', fontWeight: 'bold', color: '#666' }}>#{player.jerseyNumber}</span>
                      <span>{player.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {(['starting', 'substitute', 'none'] as const).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => onLineupChange(player.id || '', teamType, type)}
                          style={{
                            padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer',
                            backgroundColor: status === type ? (type === 'starting' ? '#4caf50' : type === 'substitute' ? '#2196f3' : '#e0e0e0') : '#fff',
                            color: status === type && type !== 'none' ? '#fff' : '#333',
                          }}
                        >
                          {type === 'starting' ? '首发' : type === 'substitute' ? '替补' : '未上场'}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div>
            {(['starting', 'substitute'] as const).map(lineupType => (
              <div key={lineupType}>
                <h4 style={{ fontWeight: 'bold', color: lineupType === 'starting' ? '#4caf50' : '#2196f3', marginTop: '10px' }}>
                  {lineupType === 'starting' ? '首发球员' : '替补球员'}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '8px 0' }}>
                  {(selectedMatch.lineups || []).filter(l => l.teamType === teamType && l.lineupType === lineupType).length === 0 ? (
                    <span style={{ color: '#999' }}>未设置</span>
                  ) : (
                    (selectedMatch.lineups || [])
                      .filter(l => l.teamType === teamType && l.lineupType === lineupType)
                      .map(l => (
                        <span key={l.id} style={{
                          padding: '4px 8px',
                          backgroundColor: lineupType === 'starting' ? '#e8f5e9' : '#e3f2fd',
                          color: lineupType === 'starting' ? '#2e7d32' : '#1565c0',
                          borderRadius: '4px', fontSize: '13px'
                        }}>
                          #{l.player?.jerseyNumber} {l.player?.name}
                        </span>
                      ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
          {renderLineupEditor('home')}
          {renderLineupEditor('away')}
        </div>
      </div>

      {/* 事件表格：主队 */}
      <EventTable
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
      <EventTable
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

import React from 'react';
import { Plus, X } from 'lucide-react';
import { PlayerDTO } from '../../../api/types';
import { MatchEvent } from '../../../types';

const EVENT_TYPE_LABELS: Record<string, string> = {
  goal: '⚽ 普通进球', penalty: '🎯 点球', own_goal: '🥅 乌龙球',
  substitution: '🔄 换人', yellow_card: '🟨 黄牌', red_card: '🟥 红牌',
  yellow_to_red: '🟨🟥 两黄变一红', penalty_shootout_goal: '🥅⚽ 点球大战进球',
  penalty_shootout_miss: '🥅❌ 点球大战飞点/罚失', penalty_miss: '❌ 常规时间点球罚失',
};

interface MatchEventTableProps {
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

export const MatchEventTable: React.FC<MatchEventTableProps> = ({
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


import React from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { MatchEvent } from '../../../types';
import { PlayerDTO } from '../../../api/types';
import {
  EVENT_TYPE_LABELS,
  isShootoutEventType,
} from '../../../utils/matchEvents';

interface EventTableProps {
  teamType: 'home' | 'away';
  events: MatchEvent[];
  players: PlayerDTO[];
  addEvent: (team: 'home' | 'away') => void;
  removeEvent: (index: number) => void;
  updateEvent: (index: number, field: keyof MatchEvent, value: any) => void;
  handleEventPlayerSelect: (index: number, playerId: string) => void;
  handleSubPlayerSelect: (index: number, playerId: string) => void;
  handleAssistPlayerSelect: (index: number, playerId: string) => void;
}

const EventTable: React.FC<EventTableProps> = ({
  teamType,
  events,
  players,
  addEvent,
  removeEvent,
  updateEvent,
  handleEventPlayerSelect,
  handleSubPlayerSelect,
  handleAssistPlayerSelect,
}) => {
  const isHome = teamType === 'home';
  const label = isHome ? '主队' : '客队';
  const icon = isHome ? '👕' : '👚';
  const teamEvents = events.filter(e => e.teamType === teamType);

  return (
    <div className="form-section">
      <div className="section-header">
        <h2 className="form-title">
          <span className="icon">{icon}</span>
          {label}事件记录（进球、换人、红黄牌）
        </h2>
        <button
          type="button"
          onClick={() => addEvent(teamType)}
          className="add-btn"
        >
          <Plus size={16} />
          添加{label}事件
        </button>
      </div>
      {teamEvents.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <p>暂无{label}事件记录，点击上方按钮添加</p>
        </div>
      ) : (
        <div className="player-table-wrapper">
          <table className="player-table events-input-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>时间</th>
                <th style={{ width: '150px' }}>事件类型</th>
                <th style={{ width: '220px' }}>球员</th>
                <th style={{ width: '120px' }}>号码</th>
                <th>事件描述</th>
                <th style={{ width: '80px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, index) => {
                if (event.teamType !== teamType) return null;
                return (
                  <tr key={index}>
                    <td data-label="时间">
                      {isShootoutEventType(event.eventType) ? (
                        <div style={{ display: 'grid', gap: '4px' }}>
                          <input
                            type="number"
                            min={1}
                            value={event.shootoutRound || ''}
                            onChange={(e) => updateEvent(index, 'shootoutRound', Number(e.target.value))}
                            className="form-input inline"
                            aria-label="点球大战轮次"
                            placeholder="轮次"
                            required
                          />
                          <input
                            type="number"
                            min={1}
                            value={event.shootoutOrder || ''}
                            onChange={(e) => updateEvent(index, 'shootoutOrder', Number(e.target.value))}
                            className="form-input inline"
                            aria-label="点球大战罚球顺序"
                            placeholder="顺序"
                            required
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={event.eventTime}
                          onChange={(e) => updateEvent(index, 'eventTime', e.target.value)}
                          className="form-input inline"
                          placeholder="如：35'"
                          required
                        />
                      )}
                    </td>
                    <td data-label="事件类型">
                      <select
                        value={event.eventType}
                        onChange={(e) => updateEvent(index, 'eventType', e.target.value as any)}
                        className="form-select inline"
                        required
                      >
                        {Object.entries(EVENT_TYPE_LABELS).map(([value, text]) => (
                          <option key={value} value={value}>{text}</option>
                        ))}
                      </select>
                    </td>
                    <td data-label="球员">
                      {event.eventType === 'substitution' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <select
                            value={event.playerId || ''}
                            onChange={(e) => handleEventPlayerSelect(index, e.target.value)}
                            className="form-select inline"
                            required
                          >
                            <option value="">请选择换上球员</option>
                            {players.map((player) => (
                              <option key={player.id} value={player.id}>
                                换上: {player.name} ({player.jerseyNumber}号)
                              </option>
                            ))}
                          </select>
                          <select
                            value={event.subPlayerId || ''}
                            onChange={(e) => handleSubPlayerSelect(index, e.target.value)}
                            className="form-select inline"
                            required
                          >
                            <option value="">请选择换下球员</option>
                            {players.map((player) => (
                              <option key={player.id} value={player.id}>
                                换下: {player.name} ({player.jerseyNumber}号)
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <select
                            value={event.playerId || ''}
                            onChange={(e) => handleEventPlayerSelect(index, e.target.value)}
                            className="form-select inline"
                            required
                          >
                            <option value="">请选择进球/得牌球员</option>
                            {players.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name} ({player.jerseyNumber}号)
                              </option>
                            ))}
                          </select>
                          {event.eventType === 'goal' && (
                            <select
                              value={event.assistPlayerId || ''}
                              onChange={(e) => handleAssistPlayerSelect(index, e.target.value)}
                              className="form-select inline"
                              style={{ borderColor: '#adb5bd' }}
                            >
                              <option value="">（可选）请选择助攻球员</option>
                              {players
                                .filter(p => p.id !== event.playerId)
                                .map((player) => (
                                  <option key={player.id} value={player.id}>
                                    助攻: {player.name} ({player.jerseyNumber}号)
                                  </option>
                                ))}
                            </select>
                          )}
                        </div>
                      )}
                    </td>
                    <td data-label="号码">
                      <div className="form-value inline" style={{ fontSize: '0.85rem' }}>
                        {event.eventType === 'substitution' ? (
                          <span>
                            上: {event.jerseyNumber || '-'} <br/>
                            下: {event.subJerseyNumber || '-'}
                          </span>
                        ) : (
                          event.jerseyNumber || '-'
                        )}
                      </div>
                    </td>
                    <td data-label="事件描述">
                      <input
                        type="text"
                        value={event.description}
                        onChange={(e) => updateEvent(index, 'description', e.target.value)}
                        className="form-input inline"
                        placeholder={event.eventType === 'substitution' ? "选填，自动生成换人描述" : "选填，自动生成事件描述"}
                      />
                    </td>
                    <td data-label="操作">
                      <button
                        type="button"
                        onClick={() => removeEvent(index)}
                        className="delete-btn"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EventTable;

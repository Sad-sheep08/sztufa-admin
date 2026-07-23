import React from 'react';
import { Calendar, Edit2, Trash2, Eye, RefreshCw } from 'lucide-react';
import { Match } from '../../../types';
import { Pagination } from '../../../components/Pagination';
import { getMatchPenaltyScore } from '../../../utils/matchEvents';

interface MatchListPanelProps {
  matches: Match[];
  seasons: any[];
  selectedSeasonId: string;
  selectedMatch: Match | null;
  isLoading: boolean;
  currentPage: number;
  total: number;
  pageSize: number;
  canEdit: boolean;
  isSuperAdmin: boolean;
  onSeasonChange: (seasonId: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onViewMatch: (match: Match) => void;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
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

const getMatchStatus = (match: Match) => {
  if (match.status === 'scheduled') return { text: '未开始', color: 'warning' };
  if (match.status === 'ongoing') return { text: '进行中', color: 'info' };
  if (match.status === 'finished') return { text: '已结束', color: 'success' };
  const now = new Date();
  const matchTime = new Date(match.matchTime);
  if (matchTime > now) return { text: '未开始', color: 'warning' };
  return { text: '已结束', color: 'success' };
};

export const MatchListPanel: React.FC<MatchListPanelProps> = ({
  matches,
  seasons,
  selectedSeasonId,
  selectedMatch,
  isLoading,
  currentPage,
  total,
  pageSize,
  canEdit,
  isSuperAdmin,
  onSeasonChange,
  onPageChange,
  onRefresh,
  onViewMatch,
  onEditMatch,
  onDeleteMatch,
}) => {
  return (
    <div className="form-section">
      <div className="section-header">
        <h2 className="form-title">
          <span className="icon">⚽</span>
          比赛列表
        </h2>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginLeft: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>选择赛季:</span>
            <select
              value={selectedSeasonId}
              onChange={(e) => onSeasonChange(e.target.value)}
              className="form-select inline"
              style={{ width: '180px', padding: '6px 12px', height: 'auto', margin: 0 }}
            >
              <option value="all">显示全部赛季</option>
              {seasons.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.status === 'active' ? '(当前赛季)' : '(已归档)'}
                </option>
              ))}
            </select>
          </div>
          <button onClick={onRefresh} className="add-btn refresh-btn" disabled={isLoading} style={{ margin: 0 }}>
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
            刷新列表
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">加载中...</div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <Calendar size={48} />
          <p>暂无比赛数据，请先录入比赛信息</p>
        </div>
      ) : (
        <div className="player-table-wrapper">
          <table className="player-table">
            <thead>
              <tr>
                <th>比赛名称</th>
                <th>比赛时间</th>
                <th>主队</th>
                <th>客队</th>
                <th>比分</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const status = getMatchStatus(match);
                const penaltyScore = getMatchPenaltyScore(match);
                return (
                  <tr key={match.id} className={selectedMatch?.id === match.id ? 'selected' : ''}>
                    <td>{match.matchName}</td>
                    <td>{formatMatchTime(match.matchTime)}</td>
                    <td className="team-name-cell home">{match.homeTeamName}</td>
                    <td className="team-name-cell away">{match.awayTeamName}</td>
                    <td>
                      <div className="score-cell">
                        <div className="regular-score-line">
                          <span className="score-value home">{match.homeTeamScore}</span>
                          <span className="score-separator">:</span>
                          <span className="score-value away">{match.awayTeamScore}</span>
                        </div>
                        {penaltyScore && (
                          <span className="penalty-score-inline">
                            点球 {penaltyScore.home}-{penaltyScore.away}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${status.color}`}>{status.text}</span>
                    </td>
                    <td>
                      <button onClick={() => onViewMatch(match)} className="action-btn view-btn" title="查看详情">
                        <Eye size={14} />
                      </button>
                      {canEdit && (
                        <>
                          <button onClick={() => onEditMatch(match)} className="action-btn edit-btn" title="编辑">
                            <Edit2 size={14} />
                          </button>
                          {isSuperAdmin && (
                            <button onClick={() => onDeleteMatch(match.id)} className="delete-btn small" title="删除">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            total={total}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

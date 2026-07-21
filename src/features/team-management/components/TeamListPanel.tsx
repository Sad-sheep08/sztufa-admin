import React from 'react';
import { Users, Eye, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Team } from '../../../types';
import { Pagination } from '../../../components/Pagination';

interface TeamListPanelProps {
  teams: Team[];
  seasons: any[];
  filterSeasonId: string;
  selectedTeam: Team | null;
  isLoading: boolean;
  currentPage: number;
  total: number;
  pageSize: number;
  userRole?: string;
  userTeamId?: string;
  onSeasonChange: (seasonId: string) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onViewTeam: (team: Team) => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
}

export const TeamListPanel: React.FC<TeamListPanelProps> = ({
  teams, seasons, filterSeasonId, selectedTeam,
  isLoading, currentPage, total, pageSize, userRole, userTeamId,
  onSeasonChange, onPageChange, onRefresh, onViewTeam, onEditTeam, onDeleteTeam,
}) => {
  return (
    <div className="form-section">
      <div style={{ display: 'flex', gap: '15px', padding: '15px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa', borderRadius: '8px 8px 0 0' }}>
        <div className="form-group" style={{ margin: 0, flex: 1 }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#666', marginBottom: '4px', display: 'block' }}>按赛季筛选球队</label>
          <select
            value={filterSeasonId}
            onChange={(e) => onSeasonChange(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', height: '36px', backgroundColor: '#fff' }}
          >
            <option value="all">全部赛季 (All Seasons)</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.status === 'active' ? '(当前活跃)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: '10px' }}>
        <h2 className="form-title">
          <span className="icon">🏆</span>
          球队列表
        </h2>
        <button onClick={onRefresh} className="add-btn refresh-btn" disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          刷新列表
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">加载中...</div>
      ) : teams.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p>暂无球队数据，请先录入球队信息</p>
        </div>
      ) : (
        <div className="player-table-wrapper">
          <table className="player-table">
            <thead>
              <tr>
                <th>球队名称</th>
                <th>主教练</th>
                <th>领队</th>
                <th style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className={selectedTeam?.id === team.id ? 'selected' : ''}>
                  <td>{team.teamName}</td>
                  <td>{team.headCoach}</td>
                  <td>{team.teamLeader}</td>
                  <td>
                    <button onClick={() => onViewTeam(team)} className="action-btn view-btn" title="查看详情">
                      <Eye size={14} />
                    </button>
                    {(userRole === 'super_admin' || (userRole === 'coach' && userTeamId === team.id)) && (
                      <button onClick={() => onEditTeam(team)} className="action-btn edit-btn" title="编辑">
                        <Edit2 size={14} />
                      </button>
                    )}
                    {userRole === 'super_admin' && (
                      <button onClick={() => onDeleteTeam(team.id)} className="delete-btn small" title="删除">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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

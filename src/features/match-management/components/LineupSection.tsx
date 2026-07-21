import React from 'react';
import { PlayerDTO } from '../../../api/types';

interface Lineup {
  playerId: string;
  teamType: 'home' | 'away';
  lineupType: 'starting' | 'substitute';
}

interface LineupSectionProps {
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamPlayers: PlayerDTO[];
  awayTeamPlayers: PlayerDTO[];
  lineups: Lineup[];
  handleLineupChange: (playerId: string, teamType: 'home' | 'away', lineupType: 'starting' | 'substitute' | 'none') => void;
}

const LineupSection: React.FC<LineupSectionProps> = ({
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamPlayers,
  awayTeamPlayers,
  lineups,
  handleLineupChange,
}) => {
  if (!homeTeamId && !awayTeamId) return null;

  const renderTeamPlayers = (
    players: PlayerDTO[],
    teamType: 'home' | 'away',
    teamName: string
  ) => {
    return (
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #ddd', paddingBottom: '6px' }}>
          {teamName || (teamType === 'home' ? '主队' : '客队')} ({teamType === 'home' ? '主队' : '客队'})
        </h3>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '6px', padding: '12px' }}>
          {players.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>暂无球员数据，请先录入名册</p>
          ) : (
            players.map(player => {
              const lineup = lineups.find(l => l.playerId === player.id);
              const status = lineup ? lineup.lineupType : 'none';
              
              return (
                <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f9f9f9' }}>
                  <div>
                    <span style={{ display: 'inline-block', width: '30px', fontWeight: 'bold', color: '#666' }}>
                      #{player.jerseyNumber}
                    </span>
                    <span>{player.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => handleLineupChange(player.id || '', teamType, 'starting')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        backgroundColor: status === 'starting' ? '#4caf50' : '#fff',
                        color: status === 'starting' ? '#fff' : '#333',
                        cursor: 'pointer'
                      }}
                    >
                      首发
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLineupChange(player.id || '', teamType, 'substitute')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        backgroundColor: status === 'substitute' ? '#2196f3' : '#fff',
                        color: status === 'substitute' ? '#fff' : '#333',
                        cursor: 'pointer'
                      }}
                    >
                      替补
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLineupChange(player.id || '', teamType, 'none')}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                        backgroundColor: status === 'none' ? '#e0e0e0' : '#fff',
                        color: '#333',
                        cursor: 'pointer'
                      }}
                    >
                      未上场
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="form-section">
      <div className="section-header">
        <h2 className="form-title">
          <span className="icon">🏃‍♂️</span>
          首发与替补名单配置
        </h2>
      </div>
      
      <div className="lineups-admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {renderTeamPlayers(homeTeamPlayers, 'home', homeTeamName)}
        {renderTeamPlayers(awayTeamPlayers, 'away', awayTeamName)}
      </div>
    </div>
  );
};

export default LineupSection;

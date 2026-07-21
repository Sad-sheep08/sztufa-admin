import React from 'react';
import { PlayerDTO } from '../../../api/types';
import { Match } from '../../../types';

interface MatchLineupPanelProps {
  teamType: 'home' | 'away';
  selectedMatch: Match;
  editData: Match | null;
  isEditing: boolean;
  players: PlayerDTO[];
  onLineupChange: (
    playerId: string,
    teamType: 'home' | 'away',
    type: 'starting' | 'substitute' | 'none',
  ) => void;
}

export const MatchLineupPanel: React.FC<MatchLineupPanelProps> = ({
  teamType,
  selectedMatch,
  editData,
  isEditing,
  players,
  onLineupChange,
}) => {
  const teamName = isEditing
    ? teamType === 'home'
      ? editData?.homeTeamName
      : editData?.awayTeamName
    : teamType === 'home'
      ? selectedMatch.homeTeamName
      : selectedMatch.awayTeamName;
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
            players.map((player) => {
              const lineup = (editData?.lineups || []).find((item) => item.playerId === player.id);
              const status = lineup ? lineup.lineupType : 'none';
              return (
                <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f9f9f9' }}>
                  <div>
                    <span style={{ display: 'inline-block', width: '30px', fontWeight: 'bold', color: '#666' }}>#{player.jerseyNumber}</span>
                    <span>{player.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['starting', 'substitute', 'none'] as const).map((type) => (
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
          {(['starting', 'substitute'] as const).map((lineupType) => {
            const lineups = (selectedMatch.lineups || []).filter(
              (lineup) => lineup.teamType === teamType && lineup.lineupType === lineupType,
            );
            return (
              <div key={lineupType}>
                <h4 style={{ fontWeight: 'bold', color: lineupType === 'starting' ? '#4caf50' : '#2196f3', marginTop: '10px' }}>
                  {lineupType === 'starting' ? '首发球员' : '替补球员'}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '8px 0' }}>
                  {lineups.length === 0 ? (
                    <span style={{ color: '#999' }}>未设置</span>
                  ) : (
                    lineups.map((lineup) => (
                      <span key={lineup.id} style={{
                        padding: '4px 8px',
                        backgroundColor: lineupType === 'starting' ? '#e8f5e9' : '#e3f2fd',
                        color: lineupType === 'starting' ? '#2e7d32' : '#1565c0',
                        borderRadius: '4px', fontSize: '13px',
                      }}>
                        #{lineup.player?.jerseyNumber} {lineup.player?.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { MatchDetailPanel, MatchListPanel } from './components';
import { useMatchData, useMatchEditor } from './hooks';

const MatchViewEditPage: React.FC = () => {
  const { user } = useAuth();
  const data = useMatchData();
  const editor = useMatchEditor({
    setSelectedMatch: data.setSelectedMatch,
    homeTeamPlayers: data.homeTeamPlayers,
    awayTeamPlayers: data.awayTeamPlayers,
    loadTeamPlayers: data.loadTeamPlayers,
    loadMatches: data.loadMatches,
    setIsLoading: data.setIsLoading,
    setError: data.setError,
  });
  const canEdit = user?.role === 'super_admin' || user?.role === 'match_scorer';

  const deleteMatch = async (matchId: string) => {
    const deleted = await data.deleteMatch(matchId);
    if (deleted && data.selectedMatch?.id === matchId) editor.cancelEdit();
  };

  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1><Calendar className="trophy-icon" />比赛信息管理</h1>
          <p>查看和管理所有比赛信息</p>
        </div>
      </header>

      <main className="page-content">
        {data.error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{data.error}</span>
          </div>
        )}

        <MatchListPanel
          matches={data.matches}
          seasons={data.seasons}
          selectedSeasonId={data.selectedSeasonId}
          selectedMatch={data.selectedMatch}
          isLoading={data.isLoading}
          currentPage={data.currentPage}
          total={data.totalMatches}
          pageSize={data.pageSize}
          canEdit={canEdit}
          isSuperAdmin={user?.role === 'super_admin'}
          onSeasonChange={data.changeSeason}
          onPageChange={data.changePage}
          onRefresh={data.loadMatches}
          onViewMatch={editor.viewMatch}
          onEditMatch={editor.editMatch}
          onDeleteMatch={deleteMatch}
        />

        {data.selectedMatch ? (
          <MatchDetailPanel
            selectedMatch={data.selectedMatch}
            isEditing={editor.isEditing}
            isSaved={editor.isSaved}
            isLoading={data.isLoading}
            editData={editor.editData}
            seasons={data.seasons}
            selectedSeasonId={data.selectedSeasonId}
            homeTeamPlayers={data.homeTeamPlayers}
            awayTeamPlayers={data.awayTeamPlayers}
            onSaveEdit={editor.saveEdit}
            onCancelEdit={editor.cancelEdit}
            onFieldChange={editor.changeField}
            onSetEditData={editor.setEditData}
            onLineupChange={editor.changeLineup}
            onEventChange={editor.changeEvent}
            onEventPlayerSelect={(index, playerId) => editor.selectEventPlayer(index, playerId)}
            onSubPlayerSelect={(index, playerId) => editor.selectEventPlayer(index, playerId, 'sub')}
            onAssistPlayerSelect={(index, playerId) => editor.selectEventPlayer(index, playerId, 'assist')}
            onAddEvent={editor.addEvent}
            onRemoveEvent={editor.removeEvent}
          />
        ) : (
          <div className="form-section empty-detail-section">
            <div className="empty-state">
              <Calendar size={48} />
              <p>请选择一场比赛查看详情</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MatchViewEditPage;

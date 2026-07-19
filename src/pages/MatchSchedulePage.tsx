import React from 'react';
import { Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTeamData } from './MatchSchedulePage/hooks/useTeamData';
import { TeamListPanel, TeamDetailPanel, TeamPlayerPanel } from './MatchSchedulePage/components';

const TeamViewEditPage: React.FC = () => {
  const { user } = useAuth();
  const {
    teams, selectedTeam, isEditing, isLoading, error, isSaved, saveProgress,
    editData, showImporter, allMatches, activeSeasonName,
    seasons, filterSeasonId, currentPage, totalTeams, pageSize,
    handleSeasonChange, handlePageChange, setShowImporter,
    loadTeams, handleViewTeam, handleEditTeam, handleSaveEdit,
    handleDeleteTeam, handleCancelEdit, handleFieldChange,
    handlePlayerFieldChange, handleDeletePlayerRow, handleAddPlayerRow,
    handleExcelImport, handleExportPlayers,
  } = useTeamData(user);

  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Users className="trophy-icon" />
            球队信息管理
          </h1>
          <p>查看和管理所有球队信息</p>
        </div>
      </header>

      <main className="page-content">
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <TeamListPanel
          teams={teams}
          seasons={seasons}
          filterSeasonId={filterSeasonId}
          selectedTeam={selectedTeam}
          isLoading={isLoading}
          currentPage={currentPage}
          total={totalTeams}
          pageSize={pageSize}
          userRole={user?.role}
          userTeamId={user?.teamId}
          onSeasonChange={handleSeasonChange}
          onPageChange={handlePageChange}
          onRefresh={() => loadTeams(currentPage, filterSeasonId)}
          onViewTeam={handleViewTeam}
          onEditTeam={handleEditTeam}
          onDeleteTeam={handleDeleteTeam}
        />

        {selectedTeam && (
          <TeamDetailPanel
            selectedTeam={selectedTeam}
            isEditing={isEditing}
            isSaved={isSaved}
            isLoading={isLoading}
            editData={editData}
            activeSeasonName={activeSeasonName}
            allMatches={allMatches}
            userRole={user?.role}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onFieldChange={handleFieldChange}
          />
        )}

        {selectedTeam && (
          <TeamPlayerPanel
            selectedTeam={selectedTeam}
            isEditing={isEditing}
            editData={editData}
            showImporter={showImporter}
            onToggleImporter={() => setShowImporter(!showImporter)}
            onAddPlayerRow={handleAddPlayerRow}
            onDeletePlayerRow={handleDeletePlayerRow}
            onPlayerFieldChange={handlePlayerFieldChange}
            onExcelImport={handleExcelImport}
            onExportPlayers={handleExportPlayers}
          />
        )}

        {!selectedTeam && (
          <div className="form-section empty-detail-section">
            <div className="empty-state">
              <Users size={48} />
              <p>请选择一支球队查看详情</p>
            </div>
          </div>
        )}
      </main>

      {saveProgress && (
        <div className="progress-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div className="progress-card" style={{
            backgroundColor: '#ffffff',
            padding: '24px 32px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            width: '90%',
            maxWidth: '400px',
            textAlign: 'center',
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#333' }}>
              正在同步球队与球员数据...
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
              {saveProgress.message} ({saveProgress.current}/{saveProgress.total})
            </p>
            <div className="progress-bar-container" style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '8px',
            }}>
              <div className="progress-bar-fill" style={{
                width: `${(saveProgress.current / saveProgress.total) * 100}%`,
                height: '100%',
                backgroundColor: '#3b5bdb',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: '12px', color: '#868e96' }}>
              请勿关闭或刷新页面
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamViewEditPage;

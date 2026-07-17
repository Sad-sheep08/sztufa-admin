import React from 'react';
import { Calendar, Save, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useMatchForm } from './hooks/useMatchForm';
import MatchBasicInfo from './components/MatchBasicInfo';
import TeamScoreSection from './components/TeamScoreSection';
import LineupSection from './components/LineupSection';
import EventTable from './components/EventTable';

const TeamManagementPage: React.FC = () => {
  const {
    formData,
    setFormData,
    activeSeasons,
    activeSeason,
    isSaved,
    isLoading,
    isVerifyingTeams,
    error,
    availableTeams,
    homeTeamPlayers,
    awayTeamPlayers,
    lineups,
    handleLineupChange,
    handleSeasonSelect,
    getFilteredTeams,
    addEvent,
    removeEvent,
    updateEvent,
    handleEventPlayerSelect,
    handleSubPlayerSelect,
    handleAssistPlayerSelect,
    handleSubmit,
    handleChange,
    handleTeamSelect,
  } = useMatchForm();

  return (
    <div className="match-entry-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Calendar className="trophy-icon" />
            比赛信息录入
          </h1>
          <p>录入比赛时间、比分及进球球员信息</p>
        </div>
      </header>

      <main className="page-content">
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <MatchBasicInfo
            formData={formData}
            activeSeasons={activeSeasons}
            handleChange={handleChange}
            handleSeasonSelect={handleSeasonSelect}
          />

          <TeamScoreSection
            formData={formData}
            setFormData={setFormData}
            activeSeason={activeSeason}
            availableTeams={availableTeams}
            getFilteredTeams={getFilteredTeams}
            handleChange={handleChange}
            handleTeamSelect={handleTeamSelect}
          />

          <LineupSection
            homeTeamId={formData.homeTeamId}
            awayTeamId={formData.awayTeamId}
            homeTeamName={formData.homeTeamName}
            awayTeamName={formData.awayTeamName}
            homeTeamPlayers={homeTeamPlayers}
            awayTeamPlayers={awayTeamPlayers}
            lineups={lineups}
            handleLineupChange={handleLineupChange}
          />

          <EventTable
            teamType="home"
            events={formData.events}
            players={homeTeamPlayers}
            addEvent={addEvent}
            removeEvent={removeEvent}
            updateEvent={updateEvent}
            handleEventPlayerSelect={handleEventPlayerSelect}
            handleSubPlayerSelect={handleSubPlayerSelect}
            handleAssistPlayerSelect={handleAssistPlayerSelect}
          />

          <EventTable
            teamType="away"
            events={formData.events}
            players={awayTeamPlayers}
            addEvent={addEvent}
            removeEvent={removeEvent}
            updateEvent={updateEvent}
            handleEventPlayerSelect={handleEventPlayerSelect}
            handleSubPlayerSelect={handleSubPlayerSelect}
            handleAssistPlayerSelect={handleAssistPlayerSelect}
          />
        </form>
      </main>

      <footer className="page-footer">
        <div className="footer-actions">
          <button 
            onClick={handleSubmit} 
            className="save-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="loader" />
                {isVerifyingTeams ? '验证球队信息中...' : '保存中...'}
              </>
            ) : (
              <>
                <Save size={18} />
                保存比赛信息
              </>
            )}
          </button>
        </div>
        {isSaved && (
          <div className="save-success">
            <CheckCircle size={20} />
            保存成功！数据已持久化到数据库
          </div>
        )}
      </footer>
    </div>
  );
};

export default TeamManagementPage;

import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { matchApi, seasonApi, teamApi } from '../../api/service';
import { MatchDTO, PlayerDTO } from '../../api/types';
import { Match, Goal, MatchEvent } from '../../types';
import { generateId } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';
import { MatchListPanel, MatchDetailPanel } from './components';

const MatchViewEditPage: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'super_admin' || user?.role === 'match_scorer';
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const [editData, setEditData] = useState<Match | null>(null);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<PlayerDTO[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<PlayerDTO[]>([]);

  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('all');
  const [seasonsLoaded, setSeasonsLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (seasonsLoaded) {
      loadMatches();
    }
  }, [selectedSeasonId, seasonsLoaded]);

  // ─── 数据加载 ──────────────────────────────────────────────────────────────

  const loadSeasons = async () => {
    try {
      const data = await seasonApi.getAll();
      setSeasons(data || []);
      const active = data.find((s: any) => s.status === 'active');
      if (active) setSelectedSeasonId(active.id);
      setSeasonsLoaded(true);
    } catch (err) {
      console.error('加载赛季列表失败:', err);
      setSeasonsLoaded(true);
    }
  };

  const loadTeamPlayers = async (homeTeamId: string, awayTeamId: string, seasonId?: string) => {
    try {
      const [homePlayers, awayPlayers] = await Promise.all([
        teamApi.getPlayers(homeTeamId, seasonId),
        teamApi.getPlayers(awayTeamId, seasonId),
      ]);
      setHomeTeamPlayers(homePlayers);
      setAwayTeamPlayers(awayPlayers);
    } catch (err) {
      console.error('加载球队球员失败:', err);
    }
  };

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const response = await matchApi.getAll(1, 100, undefined, selectedSeasonId);
      const matchList: Match[] = response.data.map((m: MatchDTO) => {
        const homeGoals = (m.goals || []).filter(g => g.teamType === 'home');
        const awayGoals = (m.goals || []).filter(g => g.teamType === 'away');
        return {
          id: m.id || generateId(),
          matchName: `${m.homeTeam?.teamName || '主队'} vs ${m.awayTeam?.teamName || '客队'}`,
          matchTime: m.matchDate,
          homeTeamName: m.homeTeam?.teamName,
          awayTeamName: m.awayTeam?.teamName,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          homeTeamGoals: homeGoals,
          awayTeamGoals: awayGoals,
          events: m.events || [],
          homeTeamId: m.homeTeamId,
          awayTeamId: m.awayTeamId,
          location: m.location,
          status: m.status || 'finished',
          homeTeamScore: m.homeScore,
          awayTeamScore: m.awayScore,
          mvpPlayerId: m.mvpPlayerId,
          mvpPlayerName: m.mvpPlayerName,
          seasonId: m.seasonId || '',
          lineups: m.lineups || [],
          stage: m.stage || 'LEAGUE',
          groupName: m.groupName || '',
          knockoutRound: m.knockoutRound || '',
          knockoutMatchIndex: m.knockoutMatchIndex,
        };
      });
      setMatches(matchList);
      setSelectedMatch(prev => {
        if (!prev) return null;
        const updated = matchList.find(m => m.id === prev.id);
        return updated || prev;
      });
    } catch (err) {
      console.error('加载比赛列表失败:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        setError('请先登录系统');
      } else {
        setError('网络连接失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 比赛操作 ──────────────────────────────────────────────────────────────

  const handleViewMatch = (match: Match) => {
    setSelectedMatch(match);
    setIsEditing(false);
    setEditData(null);
    setError(null);
  };

  const handleEditMatch = async (match: Match) => {
    setSelectedMatch(match);
    setEditData({ ...match });
    setIsEditing(true);
    setError(null);
    setIsSaved(false);
    if (match.homeTeamId && match.awayTeamId) {
      await loadTeamPlayers(match.homeTeamId, match.awayTeamId, match.seasonId);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('确定要删除这场比赛吗？')) return;
    setIsLoading(true);
    try {
      await matchApi.delete(matchId);
      loadMatches();
      if (selectedMatch?.id === matchId) {
        setSelectedMatch(null);
        setEditData(null);
      }
    } catch (err) {
      console.error('删除比赛失败:', err);
      setError(err instanceof Error ? err.message : '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setError(null);
  };

  const handleFieldChange = (field: keyof Match, value: string | number) => {
    if (editData) setEditData({ ...editData, [field]: value });
  };

  // ─── 阵容操作 ──────────────────────────────────────────────────────────────

  const handleLineupChange = (playerId: string, teamType: 'home' | 'away', type: 'starting' | 'substitute' | 'none') => {
    if (!editData) return;
    let lineups = [...(editData.lineups || [])];
    lineups = lineups.filter(l => l.playerId !== playerId);
    if (type !== 'none') lineups.push({ playerId, teamType, lineupType: type });
    setEditData({ ...editData, lineups });
  };

  // ─── 事件操作 ──────────────────────────────────────────────────────────────

  const handleEventPlayerSelect = (index: number, playerId: string) => {
    if (!editData) return;
    const event = editData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);
    const events = [...(editData.events || [])];
    events[index] = { ...events[index], playerId: player?.id || '', playerName: player?.name || '', jerseyNumber: player?.jerseyNumber || '' };
    setEditData({ ...editData, events });
  };

  const handleSubPlayerSelect = (index: number, playerId: string) => {
    if (!editData) return;
    const event = editData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);
    const events = [...(editData.events || [])];
    events[index] = { ...events[index], subPlayerId: player?.id || '', subPlayerName: player?.name || '', subJerseyNumber: player?.jerseyNumber || '' };
    setEditData({ ...editData, events });
  };

  const handleAssistPlayerSelect = (index: number, playerId: string) => {
    if (!editData) return;
    const event = editData.events[index];
    const players = event.teamType === 'home' ? homeTeamPlayers : awayTeamPlayers;
    const player = players.find(p => p.id === playerId);
    const events = [...(editData.events || [])];
    events[index] = { ...events[index], assistPlayerId: player?.id || null, assistPlayerName: player?.name || null, assistJerseyNumber: player?.jerseyNumber || null };
    setEditData({ ...editData, events });
  };

  const handleEventChange = (index: number, field: keyof MatchEvent, value: any) => {
    if (!editData) return;
    const events = [...(editData.events || [])];
    let newEvent = { ...events[index], [field]: value } as MatchEvent;
    if (field === 'eventType') {
      if (value !== 'goal') { newEvent.assistPlayerId = null; newEvent.assistPlayerName = null; newEvent.assistJerseyNumber = null; }
      if (value !== 'substitution') { newEvent.subPlayerId = undefined; newEvent.subPlayerName = undefined; newEvent.subJerseyNumber = undefined; }
    }
    events[index] = newEvent;
    setEditData({ ...editData, events });
  };

  const addEvent = (team: 'home' | 'away') => {
    if (!editData) return;
    const events = [
      ...(editData.events || []),
      { eventTime: '', eventType: 'goal', playerId: '', playerName: '', jerseyNumber: '', description: '', teamType: team } as MatchEvent
    ];
    setEditData({ ...editData, events });
  };

  const removeEvent = (index: number) => {
    if (!editData) return;
    const events = editData.events.filter((_, i) => i !== index);
    setEditData({ ...editData, events });
  };

  // ─── 保存 ──────────────────────────────────────────────────────────────────

  const handleSaveEdit = async () => {
    if (!editData) return;
    setError(null);

    // 比分校验
    const homeGoalsCount =
      (editData.events || []).filter(e => e.teamType === 'home' && (e.eventType === 'goal' || e.eventType === 'penalty')).length +
      (editData.events || []).filter(e => e.teamType === 'away' && e.eventType === 'own_goal').length;
    const awayGoalsCount =
      (editData.events || []).filter(e => e.teamType === 'away' && (e.eventType === 'goal' || e.eventType === 'penalty')).length +
      (editData.events || []).filter(e => e.teamType === 'home' && e.eventType === 'own_goal').length;

    if (editData.homeScore !== homeGoalsCount) {
      setError(`主队进球/点球/对方乌龙数(${homeGoalsCount})与主队得分(${editData.homeScore})不一致`);
      return;
    }
    if (editData.awayScore !== awayGoalsCount) {
      setError(`客队进球/点球/对方乌龙数(${awayGoalsCount})与客队得分(${editData.awayScore})不一致`);
      return;
    }

    if (editData.events) {
      for (const event of editData.events) {
        if (!event.eventTime || !event.eventTime.trim()) { setError('请填写所有事件的时间'); return; }
        if (event.eventType === 'substitution') {
          if (!event.playerId) { setError('请选择换人事件的换上球员'); return; }
          if (!event.subPlayerId) { setError('请选择换人事件的换下球员'); return; }
          if (event.playerId === event.subPlayerId) { setError('换上球员与换下球员不能相同'); return; }
        } else {
          if (!event.playerId) { setError('请选择事件关联的球员'); return; }
        }
      }

      const homeSubbedOff = new Set<string>();
      const awaySubbedOff = new Set<string>();
      const sortedEvents = [...editData.events].sort((a, b) => {
        const parseTime = (t: string) => parseInt(t.replace(/'/g, '')) || 0;
        return parseTime(a.eventTime) - parseTime(b.eventTime);
      });
      for (const event of sortedEvents) {
        if (event.eventType === 'substitution') {
          const subbedOffSet = event.teamType === 'home' ? homeSubbedOff : awaySubbedOff;
          if (event.playerId && subbedOffSet.has(event.playerId)) { setError(`换人错误：球员 ${event.playerName} 已经被换下过，不能再次换上`); return; }
          if (event.subPlayerId && subbedOffSet.has(event.subPlayerId)) { setError(`换人错误：球员 ${event.subPlayerName} 已经被换下过，不能再次换下`); return; }
          if (event.subPlayerId) subbedOffSet.add(event.subPlayerId);
        }
      }
    }

    setIsLoading(true);
    try {
      const events = (editData.events || []).map(e => ({
        eventTime: e.eventTime,
        eventType: e.eventType,
        description: e.description || (
          e.eventType === 'substitution' ? `换上 ${e.playerName} (${e.jerseyNumber}号)，换下 ${e.subPlayerName} (${e.subJerseyNumber}号)`
          : e.eventType === 'own_goal' ? '乌龙球'
          : e.eventType === 'penalty' ? '点球'
          : e.eventType === 'penalty_shootout_goal' ? '点球大战进球'
          : e.eventType === 'penalty_shootout_miss' ? '点球大战飞点/罚失'
          : e.eventType === 'penalty_miss' ? '点球罚失'
          : '进球'
        ),
        teamType: e.teamType,
        playerId: e.playerId || null,
        playerName: e.playerName || null,
        jerseyNumber: e.jerseyNumber || null,
        subPlayerId: e.subPlayerId || null,
        subPlayerName: e.subPlayerName || null,
        subJerseyNumber: e.subJerseyNumber || null,
        assistPlayerId: e.assistPlayerId || null,
        assistPlayerName: e.assistPlayerName || null,
        assistJerseyNumber: e.assistJerseyNumber || null,
      }));

      const goals = events
        .filter(e => e.eventType === 'goal' || e.eventType === 'penalty' || e.eventType === 'own_goal')
        .map(e => ({
          playerName: e.eventType === 'own_goal' ? `${e.playerName} (乌龙)` : e.eventType === 'penalty' ? `${e.playerName} (点球)` : e.playerName || '',
          goalTime: e.eventTime,
          jerseyNumber: e.jerseyNumber || '',
          teamType: e.eventType === 'own_goal' ? (e.teamType === 'home' ? 'away' : 'home') : e.teamType,
          playerId: e.playerId || null,
        }));

      let formattedMatchDate = editData.matchTime;
      if (formattedMatchDate) {
        try {
          const cleaned = formattedMatchDate.replace(/\//g, '-');
          const date = new Date(cleaned);
          if (!isNaN(date.getTime())) formattedMatchDate = date.toISOString();
        } catch (e) { console.error('格式化比赛日期失败:', e); }
      }

      await matchApi.update(editData.id, {
        homeScore: editData.homeScore,
        awayScore: editData.awayScore,
        matchDate: formattedMatchDate,
        location: editData.location,
        status: editData.status,
        goals,
        events,
        mvpPlayerId: editData.mvpPlayerId || null,
        mvpPlayerName: editData.mvpPlayerName || null,
        stage: editData.stage || 'LEAGUE',
        groupName: editData.stage === 'GROUP' ? editData.groupName : undefined,
        knockoutRound: editData.stage === 'KNOCKOUT' ? editData.knockoutRound : undefined,
        knockoutMatchIndex: editData.stage === 'KNOCKOUT' ? (typeof editData.knockoutMatchIndex === 'string' ? parseInt(editData.knockoutMatchIndex, 10) : editData.knockoutMatchIndex) : undefined,
        lineups: (editData.lineups || []).map(l => ({ playerId: l.playerId, teamType: l.teamType, lineupType: l.lineupType })),
      });

      setIsSaved(true);
      setError(null);
      loadMatches();
      setTimeout(() => {
        setIsSaved(false);
        setIsEditing(false);
        setEditData(null);
      }, 2000);
    } catch (err) {
      console.error('更新比赛信息失败:', err);
      setError(err instanceof Error ? err.message : '网络连接失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 渲染 ──────────────────────────────────────────────────────────────────

  return (
    <div className="team-info-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Calendar className="trophy-icon" />
            比赛信息管理
          </h1>
          <p>查看和管理所有比赛信息</p>
        </div>
      </header>

      <main className="page-content">
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <MatchListPanel
          matches={matches}
          seasons={seasons}
          selectedSeasonId={selectedSeasonId}
          selectedMatch={selectedMatch}
          isLoading={isLoading}
          canEdit={canEdit}
          isSuperAdmin={user?.role === 'super_admin'}
          onSeasonChange={setSelectedSeasonId}
          onRefresh={loadMatches}
          onViewMatch={handleViewMatch}
          onEditMatch={handleEditMatch}
          onDeleteMatch={handleDeleteMatch}
        />

        {selectedMatch ? (
          <MatchDetailPanel
            selectedMatch={selectedMatch}
            isEditing={isEditing}
            isSaved={isSaved}
            isLoading={isLoading}
            editData={editData}
            seasons={seasons}
            selectedSeasonId={selectedSeasonId}
            homeTeamPlayers={homeTeamPlayers}
            awayTeamPlayers={awayTeamPlayers}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onFieldChange={handleFieldChange}
            onSetEditData={setEditData}
            onLineupChange={handleLineupChange}
            onEventChange={handleEventChange}
            onEventPlayerSelect={handleEventPlayerSelect}
            onSubPlayerSelect={handleSubPlayerSelect}
            onAssistPlayerSelect={handleAssistPlayerSelect}
            onAddEvent={addEvent}
            onRemoveEvent={removeEvent}
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

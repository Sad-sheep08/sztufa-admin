import { MatchDTO } from '../../../api/types';
import { Match, MatchEvent } from '../../../types';
import { generateId } from '../../../utils';
import {
  EVENT_DEFAULT_DESCRIPTIONS,
  isShootoutEventType,
  validateShootoutEvents,
} from '../../../utils/matchEvents';

export const mapMatchDto = (match: MatchDTO): Match => {
  const homeGoals = (match.goals || []).filter((goal) => goal.teamType === 'home');
  const awayGoals = (match.goals || []).filter((goal) => goal.teamType === 'away');
  return {
    id: match.id || generateId(),
    matchName: `${match.homeTeam?.teamName || '主队'} vs ${match.awayTeam?.teamName || '客队'}`,
    matchTime: match.matchDate,
    homeTeamName: match.homeTeam?.teamName,
    awayTeamName: match.awayTeam?.teamName,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homePenaltyScore: match.homePenaltyScore,
    awayPenaltyScore: match.awayPenaltyScore,
    winnerTeamId: match.winnerTeamId,
    decidedBy: match.decidedBy,
    homeTeamGoals: homeGoals,
    awayTeamGoals: awayGoals,
    events: match.events || [],
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    location: match.location,
    status: match.status || 'finished',
    homeTeamScore: match.homeScore,
    awayTeamScore: match.awayScore,
    mvpPlayerId: match.mvpPlayerId,
    mvpPlayerName: match.mvpPlayerName,
    seasonId: match.seasonId || '',
    lineups: match.lineups || [],
    stage: match.stage || 'LEAGUE',
    groupName: match.groupName || '',
    knockoutRound: match.knockoutRound || '',
    knockoutMatchIndex: match.knockoutMatchIndex,
  };
};

export const validateMatchEdit = (match: Match): string | null => {
  const events = match.events || [];
  const homeGoalsCount =
    events.filter(
      (event) =>
        event.teamType === 'home' &&
        (event.eventType === 'goal' || event.eventType === 'penalty'),
    ).length +
    events.filter((event) => event.teamType === 'away' && event.eventType === 'own_goal').length;
  const awayGoalsCount =
    events.filter(
      (event) =>
        event.teamType === 'away' &&
        (event.eventType === 'goal' || event.eventType === 'penalty'),
    ).length +
    events.filter((event) => event.teamType === 'home' && event.eventType === 'own_goal').length;

  if (match.homeScore !== homeGoalsCount) {
    return `主队进球/点球/对方乌龙数(${homeGoalsCount})与主队得分(${match.homeScore})不一致`;
  }
  if (match.awayScore !== awayGoalsCount) {
    return `客队进球/点球/对方乌龙数(${awayGoalsCount})与客队得分(${match.awayScore})不一致`;
  }
  const shootoutError = validateShootoutEvents(
    events,
    match.homeScore,
    match.awayScore,
  );
  if (shootoutError) return shootoutError;

  for (const event of events) {
    if (
      !isShootoutEventType(event.eventType) &&
      (!event.eventTime || !event.eventTime.trim())
    ) {
      return '请填写所有事件的时间';
    }
    if (event.eventType === 'substitution') {
      if (!event.playerId) return '请选择换人事件的换上球员';
      if (!event.subPlayerId) return '请选择换人事件的换下球员';
      if (event.playerId === event.subPlayerId) return '换上球员与换下球员不能相同';
    } else if (!event.playerId) {
      return '请选择事件关联的球员';
    }
  }

  const subbedOff = { home: new Set<string>(), away: new Set<string>() };
  const sortedEvents = [...events].sort((first, second) => {
    const parseTime = (time: string) => parseInt(time.replace(/'/g, ''), 10) || 0;
    return parseTime(first.eventTime) - parseTime(second.eventTime);
  });
  for (const event of sortedEvents) {
    if (event.eventType !== 'substitution') continue;
    const teamSubbedOff = subbedOff[event.teamType];
    if (event.playerId && teamSubbedOff.has(event.playerId)) {
      return `换人错误：球员 ${event.playerName} 已经被换下过，不能再次换上`;
    }
    if (event.subPlayerId && teamSubbedOff.has(event.subPlayerId)) {
      return `换人错误：球员 ${event.subPlayerName} 已经被换下过，不能再次换下`;
    }
    if (event.subPlayerId) teamSubbedOff.add(event.subPlayerId);
  }
  return null;
};

const eventDescription = (event: MatchEvent) => {
  if (event.description) return event.description;
  if (event.eventType === 'substitution') {
    return `换上 ${event.playerName} (${event.jerseyNumber}号)，换下 ${event.subPlayerName} (${event.subJerseyNumber}号)`;
  }
  return EVENT_DEFAULT_DESCRIPTIONS[event.eventType];
};

export const buildMatchUpdatePayload = (match: Match): Partial<MatchDTO> => {
  const events = (match.events || []).map((event) => ({
    eventTime: event.eventTime,
    eventType: event.eventType,
    phase: event.phase || (isShootoutEventType(event.eventType) ? 'SHOOTOUT' : 'REGULAR'),
    shootoutRound: event.shootoutRound,
    shootoutOrder: event.shootoutOrder,
    description: eventDescription(event),
    teamType: event.teamType,
    playerId: event.playerId || null,
    playerName: event.playerName || null,
    jerseyNumber: event.jerseyNumber || null,
    subPlayerId: event.subPlayerId || null,
    subPlayerName: event.subPlayerName || null,
    subJerseyNumber: event.subJerseyNumber || null,
    assistPlayerId: event.assistPlayerId || null,
    assistPlayerName: event.assistPlayerName || null,
    assistJerseyNumber: event.assistJerseyNumber || null,
  }));
  const goals = events
    .filter((event) => ['goal', 'penalty', 'own_goal'].includes(event.eventType))
    .map((event) => ({
      playerName:
        event.eventType === 'own_goal'
          ? `${event.playerName} (乌龙)`
          : event.eventType === 'penalty'
            ? `${event.playerName} (点球)`
            : event.playerName || '',
      goalTime: event.eventTime,
      jerseyNumber: event.jerseyNumber || '',
      teamType:
        event.eventType === 'own_goal'
          ? event.teamType === 'home'
            ? 'away'
            : 'home'
          : event.teamType,
      playerId: event.playerId || null,
    }));

  let matchDate = match.matchTime;
  if (matchDate) {
    const date = new Date(matchDate.replace(/\//g, '-'));
    if (!Number.isNaN(date.getTime())) matchDate = date.toISOString();
  }
  return {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    matchDate,
    location: match.location,
    status: match.status,
    goals,
    events,
    mvpPlayerId: match.mvpPlayerId || null,
    mvpPlayerName: match.mvpPlayerName || null,
    stage: match.stage || 'LEAGUE',
    groupName: match.stage === 'GROUP' ? match.groupName : undefined,
    knockoutRound: match.stage === 'KNOCKOUT' ? match.knockoutRound : undefined,
    knockoutMatchIndex:
      match.stage === 'KNOCKOUT'
        ? typeof match.knockoutMatchIndex === 'string'
          ? parseInt(match.knockoutMatchIndex, 10)
          : match.knockoutMatchIndex
        : undefined,
    lineups: (match.lineups || []).map((lineup) => ({
      playerId: lineup.playerId,
      teamType: lineup.teamType,
      lineupType: lineup.lineupType,
    })),
  };
};

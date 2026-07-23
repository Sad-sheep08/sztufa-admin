import { MatchFormData } from '../../../types';
import { MatchDTO, TeamDTO } from '../../../api/types';
import {
  EVENT_DEFAULT_DESCRIPTIONS,
  isShootoutEventType,
  validateShootoutEvents,
} from '../../../utils/matchEvents';

export interface MatchLineup {
  playerId: string;
  teamType: 'home' | 'away';
  lineupType: 'starting' | 'substitute';
}

export interface SeasonGroupAssignment {
  teamId: string;
  groupName: string;
}

export const filterTeamsForGroup = (
  teams: TeamDTO[],
  assignments: SeasonGroupAssignment[],
  groupName: string,
): TeamDTO[] => {
  if (!assignments || assignments.length === 0) return teams;

  const teamIds = assignments
    .filter((assignment) => assignment.groupName === groupName)
    .map((assignment) => assignment.teamId);

  return teams.filter((team) => team.id && teamIds.includes(team.id));
};

const parseEventTime = (time: string): number =>
  parseInt(time.replace(/'/g, ''), 10) || 0;

export const validateMatchForm = (formData: MatchFormData): string | null => {
  if (!formData.matchName.trim()) return '请选择比赛名称';
  if (!formData.matchTime.trim()) return '请选择比赛时间';
  if (!formData.homeTeamName.trim()) return '请输入主队名称';
  if (!formData.awayTeamName.trim()) return '请输入客队名称';
  if (formData.homeTeamName === formData.awayTeamName) return '主队和客队不能相同';
  if (!formData.location.trim()) return '请输入比赛地点';
  if (!formData.homeTeamScore.trim()) return '请输入主队得分';
  if (!formData.awayTeamScore.trim()) return '请输入客队得分';

  const homeScore = parseInt(formData.homeTeamScore, 10);
  const awayScore = parseInt(formData.awayTeamScore, 10);
  if (Number.isNaN(homeScore) || homeScore < 0) return '主队得分必须是非负整数';
  if (Number.isNaN(awayScore) || awayScore < 0) return '客队得分必须是非负整数';

  const homeGoalsCount = formData.events.filter(
    (event) =>
      (event.teamType === 'home' && ['goal', 'penalty'].includes(event.eventType))
      || (event.teamType === 'away' && event.eventType === 'own_goal'),
  ).length;
  const awayGoalsCount = formData.events.filter(
    (event) =>
      (event.teamType === 'away' && ['goal', 'penalty'].includes(event.eventType))
      || (event.teamType === 'home' && event.eventType === 'own_goal'),
  ).length;

  if (homeScore !== homeGoalsCount) {
    return `主队进球/点球/对方乌龙数(${homeGoalsCount})与主队得分(${homeScore})不一致`;
  }
  if (awayScore !== awayGoalsCount) {
    return `客队进球/点球/对方乌龙数(${awayGoalsCount})与客队得分(${awayScore})不一致`;
  }
  const shootoutError = validateShootoutEvents(
    formData.events,
    homeScore,
    awayScore,
  );
  if (shootoutError) return shootoutError;

  for (const event of formData.events) {
    if (!isShootoutEventType(event.eventType) && !event.eventTime.trim()) {
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

  const subbedOffByTeam = {
    home: new Set<string>(),
    away: new Set<string>(),
  };
  const sortedEvents = [...formData.events].sort(
    (left, right) => parseEventTime(left.eventTime) - parseEventTime(right.eventTime),
  );

  for (const event of sortedEvents) {
    if (event.eventType !== 'substitution') continue;
    const subbedOff = subbedOffByTeam[event.teamType];
    if (event.playerId && subbedOff.has(event.playerId)) {
      return `换人错误：球员 ${event.playerName} 已经被换下过，不能再次换上`;
    }
    if (event.subPlayerId && subbedOff.has(event.subPlayerId)) {
      return `换人错误：球员 ${event.subPlayerName} 已经被换下过，不能再次换下`;
    }
    if (event.subPlayerId) subbedOff.add(event.subPlayerId);
  }

  return null;
};

export const buildMatchDto = (
  formData: MatchFormData,
  lineups: MatchLineup[],
): MatchDTO => {
  const events = formData.events.map((event) => ({
    eventTime: event.eventTime,
    eventType: event.eventType,
    phase: event.phase || (isShootoutEventType(event.eventType) ? 'SHOOTOUT' : 'REGULAR'),
    shootoutRound: event.shootoutRound,
    shootoutOrder: event.shootoutOrder,
    description: event.description || (
      event.eventType === 'substitution'
        ? `换上 ${event.playerName} (${event.jerseyNumber}号)，换下 ${event.subPlayerName} (${event.subJerseyNumber}号)`
        : event.eventType === 'own_goal'
          ? '乌龙球'
          : event.eventType === 'penalty'
            ? '点球'
            : EVENT_DEFAULT_DESCRIPTIONS[event.eventType]
    ),
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
      playerName: event.eventType === 'own_goal'
        ? `${event.playerName} (乌龙)`
        : event.eventType === 'penalty'
          ? `${event.playerName} (点球)`
          : event.playerName || '',
      goalTime: event.eventTime,
      jerseyNumber: event.jerseyNumber || '',
      teamType: event.eventType === 'own_goal'
        ? (event.teamType === 'home' ? 'away' : 'home')
        : event.teamType,
      playerId: event.playerId || null,
    }));

  return {
    homeTeamId: formData.homeTeamId,
    awayTeamId: formData.awayTeamId,
    homeScore: parseInt(formData.homeTeamScore, 10) || 0,
    awayScore: parseInt(formData.awayTeamScore, 10) || 0,
    matchDate: new Date(formData.matchTime).toISOString(),
    location: formData.location,
    status: (formData.status as MatchDTO['status']) || 'finished',
    goals,
    events,
    stage: formData.stage || 'LEAGUE',
    groupName: formData.stage === 'GROUP' ? formData.groupName : undefined,
    knockoutRound: formData.stage === 'KNOCKOUT' ? formData.knockoutRound : undefined,
    knockoutMatchIndex: formData.stage === 'KNOCKOUT'
      ? parseInt(formData.knockoutMatchIndex || '1', 10)
      : undefined,
    seasonId: formData.seasonId || undefined,
    lineups,
  };
};

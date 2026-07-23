import { Match, MatchEvent } from '../types';

export const EVENT_TYPE_LABELS: Record<MatchEvent['eventType'], string> = {
  goal: '⚽ 普通进球',
  penalty: '🎯 点球进球',
  penalty_miss: '⚽❌ 常规时间点球罚失',
  own_goal: '🥅 乌龙球',
  substitution: '🔄 换人',
  yellow_card: '🟨 黄牌',
  red_card: '🟥 红牌',
  yellow_to_red: '🟨🟥 两黄变一红',
  penalty_shootout_goal: '⚽ 点球大战罚中',
  penalty_shootout_miss: '⚽❌ 点球大战罚失',
};

export const EVENT_DEFAULT_DESCRIPTIONS: Record<MatchEvent['eventType'], string> = {
  goal: '进球',
  penalty: '点球',
  penalty_miss: '点球罚失',
  own_goal: '乌龙球',
  substitution: '换人',
  yellow_card: '黄牌',
  red_card: '红牌',
  yellow_to_red: '两黄变一红',
  penalty_shootout_goal: '点球大战罚中',
  penalty_shootout_miss: '点球大战罚失',
};

export const isShootoutEventType = (eventType: MatchEvent['eventType']): boolean =>
  eventType === 'penalty_shootout_goal' ||
  eventType === 'penalty_shootout_miss';

export interface PenaltyScore {
  home: number;
  away: number;
}

export const getPenaltyScoreFromEvents = (
  events: MatchEvent[] = [],
): PenaltyScore | null => {
  const shootoutEvents = events.filter((event) =>
    isShootoutEventType(event.eventType),
  );
  if (shootoutEvents.length === 0) return null;

  return shootoutEvents.reduce<PenaltyScore>(
    (score, event) => {
      if (event.eventType !== 'penalty_shootout_goal') return score;
      if (event.teamType === 'home') score.home += 1;
      if (event.teamType === 'away') score.away += 1;
      return score;
    },
    { home: 0, away: 0 },
  );
};

export const getMatchPenaltyScore = (match: Match): PenaltyScore | null => {
  if (
    match.homePenaltyScore !== null &&
    match.homePenaltyScore !== undefined &&
    match.awayPenaltyScore !== null &&
    match.awayPenaltyScore !== undefined
  ) {
    return {
      home: match.homePenaltyScore,
      away: match.awayPenaltyScore,
    };
  }

  return getPenaltyScoreFromEvents(match.events);
};

export const applyEventTypeDefaults = (
  event: MatchEvent,
  eventType: MatchEvent['eventType'],
  events: MatchEvent[],
): MatchEvent => {
  const wasShootout = isShootoutEventType(event.eventType);
  if (isShootoutEventType(eventType)) {
    const nextOrder =
      Math.max(0, ...events.map((item) => item.shootoutOrder || 0)) + 1;
    const shootoutOrder =
      wasShootout && event.shootoutOrder ? event.shootoutOrder : nextOrder;
    return {
      ...event,
      eventType,
      eventTime: '点',
      phase: 'SHOOTOUT',
      shootoutOrder,
      shootoutRound:
        wasShootout && event.shootoutRound
          ? event.shootoutRound
          : Math.ceil(shootoutOrder / 2),
      description: EVENT_DEFAULT_DESCRIPTIONS[eventType],
    };
  }

  return {
    ...event,
    eventType,
    eventTime: wasShootout ? '' : event.eventTime,
    phase: 'REGULAR',
    shootoutRound: undefined,
    shootoutOrder: undefined,
    description: EVENT_DEFAULT_DESCRIPTIONS[eventType],
  };
};

export const validateShootoutEvents = (
  events: MatchEvent[],
  homeScore: number,
  awayScore: number,
): string | null => {
  const shootoutEvents = events.filter((event) =>
    isShootoutEventType(event.eventType),
  );
  if (shootoutEvents.length === 0) return null;
  if (homeScore !== awayScore) {
    return '只有常规/加时比分打平时才能录入点球大战';
  }

  const orders = new Set<number>();
  for (const event of shootoutEvents) {
    if (!event.shootoutRound || event.shootoutRound < 1) {
      return '请填写有效的点球大战轮次';
    }
    if (!event.shootoutOrder || event.shootoutOrder < 1) {
      return '请填写有效的点球大战罚球顺序';
    }
    if (orders.has(event.shootoutOrder)) {
      return `点球大战罚球顺序 ${event.shootoutOrder} 重复`;
    }
    orders.add(event.shootoutOrder);
  }
  return null;
};

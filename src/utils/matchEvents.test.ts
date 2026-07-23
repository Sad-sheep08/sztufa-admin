import { MatchEvent } from '../types';
import {
  applyEventTypeDefaults,
  getMatchPenaltyScore,
  getPenaltyScoreFromEvents,
  validateShootoutEvents,
} from './matchEvents';

const event = (overrides: Partial<MatchEvent> = {}): MatchEvent => ({
  eventTime: '',
  eventType: 'goal',
  description: '',
  teamType: 'home',
  ...overrides,
});

describe('match event helpers', () => {
  it('assigns structured round and order when changing to a shootout event', () => {
    const existing = event({
      eventTime: '点',
      eventType: 'penalty_shootout_goal',
      phase: 'SHOOTOUT',
      shootoutRound: 1,
      shootoutOrder: 1,
    });

    expect(
      applyEventTypeDefaults(
        event(),
        'penalty_shootout_miss',
        [existing],
      ),
    ).toEqual(
      expect.objectContaining({
        eventTime: '点',
        eventType: 'penalty_shootout_miss',
        phase: 'SHOOTOUT',
        shootoutRound: 1,
        shootoutOrder: 2,
        description: '点球大战罚失',
      }),
    );
  });

  it('rejects duplicate shootout order values', () => {
    const events = [
      event({
        eventType: 'penalty_shootout_goal',
        shootoutRound: 1,
        shootoutOrder: 1,
      }),
      event({
        eventType: 'penalty_shootout_miss',
        teamType: 'away',
        shootoutRound: 1,
        shootoutOrder: 1,
      }),
    ];

    expect(validateShootoutEvents(events, 1, 1)).toContain('重复');
  });

  it('requires a level full-time score before a shootout', () => {
    const events = [
      event({
        eventType: 'penalty_shootout_goal',
        shootoutRound: 1,
        shootoutOrder: 1,
      }),
    ];

    expect(validateShootoutEvents(events, 2, 1)).toContain('打平');
  });

  it('derives the shootout score from structured events', () => {
    const events = [
      event({ eventType: 'penalty_shootout_goal', teamType: 'home' }),
      event({ eventType: 'penalty_shootout_miss', teamType: 'away' }),
      event({ eventType: 'penalty_shootout_goal', teamType: 'away' }),
    ];

    expect(getPenaltyScoreFromEvents(events)).toEqual({ home: 1, away: 1 });
  });

  it('prefers the persisted shootout score when it is available', () => {
    expect(
      getMatchPenaltyScore({
        homePenaltyScore: 4,
        awayPenaltyScore: 3,
        events: [
          event({ eventType: 'penalty_shootout_goal', teamType: 'home' }),
        ],
      } as any),
    ).toEqual({ home: 4, away: 3 });
  });
});

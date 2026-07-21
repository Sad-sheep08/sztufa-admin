import { Match } from '../../../types';
import { buildMatchUpdatePayload, validateMatchEdit } from './matchEditor';

const match = (overrides: Partial<Match> = {}): Match => ({
  id: 'match-1',
  matchName: 'Home vs Away',
  matchTime: '2026-07-18T10:00',
  homeTeamId: 'home',
  awayTeamId: 'away',
  homeScore: 1,
  awayScore: 0,
  homeTeamGoals: [],
  awayTeamGoals: [],
  events: [
    {
      eventTime: "10'",
      eventType: 'goal',
      playerId: 'player-1',
      playerName: 'Player',
      jerseyNumber: '9',
      description: '',
      teamType: 'home',
    },
  ],
  location: '北区',
  status: 'finished',
  ...overrides,
});

describe('matchEditor', () => {
  it('validates scores against goal events', () => {
    expect(validateMatchEdit(match({ homeScore: 2 }))).toContain('与主队得分(2)不一致');
  });

  it('rejects invalid substitutions', () => {
    const invalid = match({
      homeScore: 0,
      events: [
        {
          eventTime: "20'",
          eventType: 'substitution',
          playerId: 'player-1',
          subPlayerId: 'player-1',
          description: '',
          teamType: 'home',
        },
      ],
    });
    expect(validateMatchEdit(invalid)).toBe('换上球员与换下球员不能相同');
  });

  it('builds backward-compatible goals from events', () => {
    const payload = buildMatchUpdatePayload(match());
    expect(payload.events?.[0]).toEqual(expect.objectContaining({ description: '进球' }));
    expect(payload.goals?.[0]).toEqual(
      expect.objectContaining({ playerName: 'Player', teamType: 'home', goalTime: "10'" }),
    );
  });
});

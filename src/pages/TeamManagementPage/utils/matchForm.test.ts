import { MatchFormData } from '../../../types';
import { buildMatchDto, validateMatchForm } from './matchForm';

const createValidForm = (): MatchFormData => ({
  matchName: 'Home vs Away',
  matchTime: '2026-07-17T10:00',
  homeTeamId: 'home-1',
  awayTeamId: 'away-1',
  homeTeamName: 'Home',
  awayTeamName: 'Away',
  homeTeamScore: '1',
  awayTeamScore: '0',
  homeTeamGoals: [],
  awayTeamGoals: [],
  events: [
    {
      eventTime: "12'",
      eventType: 'goal',
      playerId: 'scorer-1',
      playerName: 'Scorer',
      jerseyNumber: '9',
      assistPlayerId: 'assist-1',
      assistPlayerName: 'Assistant',
      assistJerseyNumber: '10',
      description: '',
      teamType: 'home',
    },
  ],
  matchDate: '',
  location: 'Main field',
  status: 'finished',
  stage: 'LEAGUE',
  seasonId: 'season-1',
});

describe('match form helpers', () => {
  it('validates a consistent match form', () => {
    expect(validateMatchForm(createValidForm())).toBeNull();
  });

  it('rejects a score that does not match goal events', () => {
    const formData = createValidForm();
    formData.homeTeamScore = '2';

    expect(validateMatchForm(formData)).toContain('与主队得分(2)不一致');
  });

  it('keeps assist fields when building the API payload', () => {
    const dto = buildMatchDto(createValidForm(), []);

    expect(dto.events).toEqual([
      expect.objectContaining({
        assistPlayerId: 'assist-1',
        assistPlayerName: 'Assistant',
        assistJerseyNumber: '10',
      }),
    ]);
  });
});

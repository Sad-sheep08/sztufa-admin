export interface Player {
  id: string;
  name: string;
  studentId: string;
  jerseyNumber: string;
  photo: string | null;
  /** 新建球队时暂存的本地照片，保存成功后不会写入接口数据。 */
  photoFile?: File | null;
  status?: string;
  yellowCards?: number;
  redCards?: number;
  teamId: string;
  team?: Team;
  createdAt?: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  teamName: string;
  teamDoctor?: string;
  headCoach?: string;
  teamLeader?: string;
  coachPhone?: string;
  leaderPhone?: string;
  homeJerseyColor: string;
  awayJerseyColor: string;
  teamLogo: string | null;
  homeJersey: string | null;
  awayJersey: string | null;
  players?: Player[];
  gender?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamFormData {
  teamName: string;
  teamDoctor: string;
  headCoach: string;
  teamLeader: string;
  coachPhone: string;
  leaderPhone: string;
  homeJerseyColor: string;
  awayJerseyColor: string;
  teamLogo: File | null;
  homeJersey: File | null;
  awayJersey: File | null;
  gender: string;
  seasonId: string;
}

export interface PlayerFormData {
  name: string;
  studentId: string;
  jerseyNumber: string;
  photo: File | string | null;
  teamId: string;
}

export interface Goal {
  playerName: string;
  goalTime: string;
  jerseyNumber: string;
}

export interface MatchEvent {
  id?: string;
  eventTime: string;
  eventType: 'goal' | 'own_goal' | 'penalty' | 'yellow_card' | 'red_card' | 'yellow_to_red' | 'substitution' | 'penalty_shootout_goal' | 'penalty_shootout_miss' | 'penalty_miss';
  phase?: 'REGULAR' | 'EXTRA_TIME' | 'SHOOTOUT';
  shootoutRound?: number;
  shootoutOrder?: number;
  playerId?: string | null;
  playerName?: string | null;
  jerseyNumber?: string | null;
  subPlayerId?: string | null;
  subPlayerName?: string | null;
  subJerseyNumber?: string | null;
  assistPlayerId?: string | null;
  assistPlayerName?: string | null;
  assistJerseyNumber?: string | null;
  description: string;
  teamType: 'home' | 'away';
}

export interface Match {
  id: string;
  matchName: string;
  matchTime: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeam?: Team;
  awayTeam?: Team;
  homeScore: number;
  awayScore: number;
  homePenaltyScore?: number | null;
  awayPenaltyScore?: number | null;
  winnerTeamId?: string | null;
  decidedBy?: 'REGULAR' | 'EXTRA_TIME' | 'PENALTIES' | null;
  homeTeamScore?: number;
  awayTeamScore?: number;
  homeTeamGoals: Goal[];
  awayTeamGoals: Goal[];
  events: MatchEvent[];
  matchDate?: string;
  location: string;
  status: 'scheduled' | 'ongoing' | 'finished' | 'cancelled' | 'completed';
  mvpPlayerId?: string | null;
  mvpPlayerName?: string | null;
  seasonId?: string;
  lineups?: any[];
  stage?: string;
  groupName?: string;
  knockoutRound?: string;
  knockoutMatchIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchFormData {
  matchName: string;
  matchTime: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamScore: string;
  awayTeamScore: string;
  homeTeamGoals: Goal[];
  awayTeamGoals: Goal[];
  events: MatchEvent[];
  matchDate: string;
  location: string;
  status?: string;
  mvpPlayerId?: string | null;
  mvpPlayerName?: string | null;
  stage?: string;
  groupName?: string;
  knockoutRound?: string;
  knockoutMatchIndex?: string;
  seasonId?: string;
}

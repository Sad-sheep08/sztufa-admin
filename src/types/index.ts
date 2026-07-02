export interface Player {
  id: string;
  name: string;
  studentId: string;
  jerseyNumber: string;
  photo: string | null;
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
}

export interface PlayerFormData {
  name: string;
  studentId: string;
  jerseyNumber: string;
  photo: File | null;
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
  eventType: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  playerId?: string | null;
  playerName?: string | null;
  jerseyNumber?: string | null;
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
  homeTeamScore?: number;
  awayTeamScore?: number;
  homeTeamGoals: Goal[];
  awayTeamGoals: Goal[];
  events: MatchEvent[];
  matchDate?: string;
  location: string;
  status: 'scheduled' | 'ongoing' | 'finished' | 'cancelled' | 'completed';
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
}
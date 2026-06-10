export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: { [key: string]: string[] };
}

export interface PlayerDTO {
  id?: string;
  name: string;
  studentId: string;
  jerseyNumber: string;
  photo?: string | null;
}

export interface TeamDTO {
  id?: string;
  teamName: string;
  teamDoctor: string;
  headCoach: string;
  teamLeader: string;
  coachPhone: string;
  leaderPhone: string;
  homeJerseyColor: string;
  awayJerseyColor: string;
  teamLogo?: string | null;
  homeJersey?: string | null;
  awayJersey?: string | null;
  players: PlayerDTO[];
  league?: string;
  foundedDate?: string;
  homeStadium?: string;
  homeCity?: string;
}

export interface GoalDTO {
  playerName: string;
  goalTime: string;
  jerseyNumber: string;
}

export interface MatchDTO {
  id?: string;
  matchName: string;
  matchTime: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamScore: number;
  awayTeamScore: number;
  homeTeamGoals: GoalDTO[];
  awayTeamGoals: GoalDTO[];
  homeTeamId?: string;
  awayTeamId?: string;
  location?: string;
}

export interface TeamListResponse {
  teams: TeamDTO[];
  total: number;
}

export interface MatchListResponse {
  matches: MatchDTO[];
  total: number;
}
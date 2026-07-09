export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

export interface PlayerDTO {
  id?: string;
  name: string;
  studentId: string;
  jerseyNumber: string;
  photo?: string | null;
  status?: string;
  yellowCards?: number;
  redCards?: number;
  teamId: string;
  team?: TeamDTO;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamDTO {
  id?: string;
  teamName: string;
  teamDoctor?: string;
  headCoach?: string;
  teamLeader?: string;
  coachPhone?: string;
  leaderPhone?: string;
  homeJerseyColor: string;
  awayJerseyColor: string;
  teamLogo?: string | null;
  homeJersey?: string | null;
  awayJersey?: string | null;
  players?: PlayerDTO[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GoalDTO {
  playerName: string;
  goalTime: string;
  jerseyNumber: string;
}

export interface MatchDTO {
  id?: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  location: string;
  status?: 'scheduled' | 'ongoing' | 'finished' | 'cancelled' | 'completed';
  homeTeam?: TeamDTO;
  awayTeam?: TeamDTO;
  goals?: any[];
  events?: any[];
  mvpPlayerId?: string | null;
  mvpPlayerName?: string | null;
  seasonId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamListResponse {
  data: TeamDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface MatchListResponse {
  data: MatchDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface PlayerListResponse {
  data: PlayerDTO[];
  total: number;
  page: number;
  limit: number;
}

export interface ImportResult {
  teams: number;
  players: number;
}

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  teamId?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface AuditLogDTO {
  id: string;
  username: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface BackupDTO {
  key: string;
  filename: string;
  size: number;
  lastModified: string;
  downloadUrl: string;
}
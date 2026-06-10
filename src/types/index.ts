export interface Player {
  id: string;
  name: string;
  studentId: string;
  jerseyNumber: string;
  photo: string | null;
}

export interface Team {
  id: string;
  teamName: string;
  teamDoctor: string;
  headCoach: string;
  teamLeader: string;
  coachPhone: string;
  leaderPhone: string;
  homeJerseyColor: string;
  awayJerseyColor: string;
  teamLogo: string | null;
  homeJersey: string | null;
  awayJersey: string | null;
  players: Player[];
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
}

export interface Goal {
  playerName: string;
  goalTime: string;
  jerseyNumber: string;
}

export interface Match {
  id: string;
  matchName: string;
  matchTime: string;
  homeTeamScore: number;
  awayTeamScore: number;
  homeTeamGoals: Goal[];
  awayTeamGoals: Goal[];
}

export interface MatchFormData {
  matchName: string;
  matchTime: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamScore: string;
  awayTeamScore: string;
  homeTeamGoals: Goal[];
  awayTeamGoals: Goal[];
}

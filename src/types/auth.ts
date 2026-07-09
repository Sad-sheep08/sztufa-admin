export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  role: string;
  teamId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
}
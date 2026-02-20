export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: Role;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  username: string;
  email: string;
  role: Role;
}

export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER';

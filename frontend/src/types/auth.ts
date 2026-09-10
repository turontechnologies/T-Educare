export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface AuthenticatedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  token: string;
}

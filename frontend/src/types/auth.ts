export type UserRole = "super_admin" | "institution_admin";

export interface AuthenticatedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  institutionName?: string;
  /** institution_admin only — links to the real record in `useInstitutionsStore`, whose `moduleKeys` cap which menu items this user's institution can access at all (see `filterNavByModules`). */
  institutionId?: string;
  /** institution_admin only — the Role (src/store/rbac.store.ts) governing their menu access. Absent or a system role means unrestricted. */
  roleId?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  token: string;
}

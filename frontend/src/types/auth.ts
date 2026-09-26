export type UserRole = "super_admin" | "institution_admin";

export interface AuthenticatedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  institutionName?: string;
  /** institution_admin only — resolved live from the real Institution record at login (see backend AuthDirectory). */
  institutionLogoUrl?: string;
  /** institution_admin only — links to the real record in `useInstitutionsStore`, whose `moduleKeys` cap which menu items this user's institution can access at all (see `filterNavByModules`). */
  institutionId?: string;
  /** institution_admin only — the real Role (hooks/use-roles.ts) governing their menu access. Absent means unrestricted (the institution's own root admin). */
  roleId?: string;
  /**
   * Resolved live by the backend from the real Role behind `roleId` — never
   * a value to look up client-side. Absent (not `[]`) means unrestricted;
   * `filterNavByAccess` treats a missing array the same as `null`. Refreshed
   * on every login/`/auth/me` poll, so editing a Role's menu keys reaches an
   * already-open session without a re-login.
   */
  menuKeys?: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  token: string;
}

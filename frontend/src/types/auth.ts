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
  /** institution_admin only — drives the "My Institution" card's Student Portal / admin portal links on the profile page. Empty until the institution has a slug (the one-time backfill assigns one to every pre-existing institution). */
  institutionSlug?: string;
  /** institution_admin only — hex color (e.g. "#1B5E20") applied as the dashboard's own `--primary` CSS override once logged in, so the whole authenticated app reflects it, not just the institution-scoped login screen. Null/absent uses the platform's default navy. */
  institutionBrandColor?: string | null;
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
  /** institution_admin only — links this login to a real Lecturer record (see types/lecturer.ts). Present only for a lecturer's own account; drives Lecture Management's self-service "My Lectures" view instead of the admin table. */
  lecturerId?: string;
  /** institution_admin only — links this login to a real StaffMember record (see types/staff-member.ts). Present only for a staff member's own account; drives Time & Attendance's self-service "My Attendance" view instead of the admin dashboard. */
  staffId?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  /** Present when logging in from an institution-scoped URL (`/login/[slug]`) — the backend rejects a login whose account belongs to a different institution. */
  institutionSlug?: string;
}

/** Public, unauthenticated — just enough to brand an institution-scoped login screen (`/login/[slug]`). */
export interface InstitutionBranding {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  brandColor: string | null;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  token: string;
}

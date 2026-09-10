export type UserManagerGender = "Male" | "Female" | "Other";
export type UserManagerStatus = "active" | "inactive";

export interface UserManagerAccount {
  id: string;
  /** Short display code shown in the table (e.g. "001") — not the same as `id`. */
  code: string;
  firstName: string;
  otherName: string;
  lastName: string;
  gender: UserManagerGender;
  email: string;
  phone: string;
  username: string;
  /** Mock-only plaintext — there is no backend yet (see CLAUDE.md). */
  password: string;
  /** Institution this admin account is assigned to, from `useInstitutionsStore`. */
  institutionName: string;
  isPrimaryAdmin: boolean;
  avatarUrl?: string;
  status: UserManagerStatus;
  createdAt: string;
  /** Soft-delete — archived accounts are hidden from the main list but never destroyed. ISO timestamp, or null if active. */
  archivedAt: string | null;
}

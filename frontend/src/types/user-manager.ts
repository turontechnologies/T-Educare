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
  /** Institution this admin account is assigned to. */
  institutionId: string;
  institutionName: string;
  isPrimaryAdmin: boolean;
  avatarUrl?: string;
  /** Real Role.id (see types/role.ts) this account is restricted to — absent/null means unrestricted (the institution's own root admin behaves this way by default). */
  roleId?: string | null;
  status: UserManagerStatus;
  createdAt: string;
  /** Soft-delete — archived accounts are hidden from the main list but never destroyed. ISO timestamp, or null if active. */
  archivedAt: string | null;
}

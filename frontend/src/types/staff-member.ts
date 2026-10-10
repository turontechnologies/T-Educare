export type StaffGender = "Male" | "Female" | "Other";

export const STAFF_MARITAL_STATUSES = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
] as const;
export type StaffMaritalStatus = (typeof STAFF_MARITAL_STATUSES)[number];

export type StaffDisciplinaryStatus = "NONE" | "SUSPENDED" | "TERMINATED";

export const STAFF_DISCIPLINARY_ACTION_TYPES = [
  "WARNING",
  "QUERY",
  "SUSPENSION",
  "TERMINATION",
  "REINSTATEMENT",
] as const;
export type StaffDisciplinaryActionType =
  (typeof STAFF_DISCIPLINARY_ACTION_TYPES)[number];

/**
 * Full staff profile (API_CONTRACT.md §8.1). `roleId`/`designationId`/
 * `departmentId` are real, independently validated FKs — the original
 * mock had `role`/`designation` as free text (both checked against the
 * same Staff Designation list by name); these are now both real FKs
 * into `StaffDesignation.id`, matching how every other multi-FK
 * resource in this app (Students, Courses) was upgraded off free text.
 * `salaryAmount`/`salaryCurrency` are nullable — not every institution
 * tracks pay through this screen. Qualifications (degrees/alma mater)
 * and the courses a staff member lectures are NOT embedded here — see
 * `StaffQualification` (its own CRUD list) and `Course.lecturerId`
 * (filter the courses store by this staff member's id).
 */
export interface StaffMember {
  id: string;
  /** Display code, e.g. "UL-10010" — unique among non-archived staff. */
  staffId: string;
  /** FK to `StaffDesignation.id` — a separate field from `designationId` per the source record, both sourced from the same Staff Designation list. */
  roleId: string;
  designationId: string;
  /** FK to `Department.id`. */
  departmentId: string;
  gender: StaffGender;
  firstName: string;
  middleName?: string;
  lastName: string;
  otherName?: string;
  maritalStatus: StaffMaritalStatus;
  email: string;
  phone: string;
  emergencyContact: string;
  /** ISO date. */
  dateOfBirth: string;
  /** ISO date. */
  employmentStartDate: string;
  contactAddress: string;
  /** Nullable — same convention as institution logo/user manager avatar (see `readFileAsDataUrl`). */
  avatarUrl?: string;
  salaryAmount?: number;
  salaryCurrency?: string;
  /** Cached current standing — see `StaffDisciplinaryRecord` for the append-only history behind it. */
  disciplinaryStatus: StaffDisciplinaryStatus;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}

/** Append-only — mirrors Student's disciplinaryStatus "cached value + immutable history" shape. */
export interface StaffDisciplinaryRecord {
  id: string;
  staffId: string;
  actionType: StaffDisciplinaryActionType;
  reason: string;
  startDate: string | null;
  endDate: string | null;
  /** The recording admin's id. */
  actorId: string | null;
  createdAt: string;
}

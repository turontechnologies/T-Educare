export type StaffGender = "Male" | "Female" | "Other";

export const STAFF_MARITAL_STATUSES = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
] as const;
export type StaffMaritalStatus = (typeof STAFF_MARITAL_STATUSES)[number];

export interface StaffMember {
  id: string;
  /** Display code, e.g. "UL-10010" — unique among non-archived staff. */
  staffId: string;
  /** Designation name — a separate field from `designation` per the source record, both sourced from the same Staff Designation list. */
  role: string;
  designation: string;
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
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}

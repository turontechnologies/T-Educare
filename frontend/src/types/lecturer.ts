export type LecturerGender = "Male" | "Female" | "Other";

/**
 * A lecturer's academic rank/role — distinct from `StaffDesignation` (the
 * general HR designation list used by Staff Management): the values here
 * read as full academic titles ("Dean of a Faculty", "Senior Lecturer")
 * rather than the shorter organizational designations ("HOD", "Bursar"),
 * so this is its own small curated list rather than a reuse of
 * `useStaffStore().designations`.
 */
export const LECTURER_POSITIONS = [
  "Dean of a Faculty",
  "Head of Department",
  "Provost",
  "Professor",
  "Associate Professor",
  "Senior Lecturer",
  "Lecturer I",
  "Lecturer II",
  "Assistant Lecturer",
] as const;
export type LecturerPosition = (typeof LECTURER_POSITIONS)[number];

/** A lecturer's organizational assignment can be at either level — some are posted directly to a School (e.g. a Dean), others to a Faculty (e.g. a HOD). */
export type LecturerAssignmentType = "school" | "faculty";

export interface Lecturer {
  id: string;
  /** Display code, e.g. "UL-10010" — unique among non-archived lecturers. */
  username: string;
  position: LecturerPosition;
  assignmentType: LecturerAssignmentType;
  /** FK to `School.id` when `assignmentType === "school"`, or `Faculty.id` when `"faculty"`. */
  assignmentId: string;
  gender: LecturerGender;
  firstName: string;
  middleName?: string;
  lastName: string;
  otherName?: string;
  email: string;
  phone: string;
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table. */
  archivedAt: string | null;
}

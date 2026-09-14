export const STUDENT_LEVELS = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
  "500 Level",
] as const;

export type StudentLevel = (typeof STUDENT_LEVELS)[number];

export type StudentGender = "Male" | "Female" | "Other";

export type StudentStatus = "active" | "inactive";

export const STUDENT_TITLES = [
  "Mr",
  "Mrs",
  "Miss",
  "Dr",
  "Chief",
  "Engr",
  "Prof",
] as const;
export type StudentTitle = (typeof STUDENT_TITLES)[number];

export const MARITAL_STATUSES = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];

export const RELIGIONS = [
  "Christian",
  "Islam",
  "Traditional",
  "Other",
] as const;
export type Religion = (typeof RELIGIONS)[number];

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const GENOTYPES = ["AA", "AS", "SS", "AC"] as const;
export type Genotype = (typeof GENOTYPES)[number];

export interface CourseResult {
  courseCode: string;
  courseTitle: string;
  score: number;
  grade: string;
  passed: boolean;
  /** Which session this attempt happened in. */
  sessionId: string;
  /** 1 = first attempt, 2 = a carryover retake, etc. — never overwritten, a new attempt is appended. */
  attempt: number;
}

/**
 * One session's worth of a student's academic standing — appended to
 * `Student.academicHistory` on every rollover, never mutated afterward.
 * This is the "never overwrite history" ledger the rollover engine writes
 * to (see `src/store/rollover.store.ts`).
 */
export interface StudentAcademicRecord {
  sessionId: string;
  level: StudentLevel;
  /** "repeat" means this record is a repeated attempt at the same level as the previous record. */
  status: "completed" | "current" | "repeat";
  courseResults: CourseResult[];
  /** Course codes still outstanding as of the end of this record. */
  carryoverCourses: string[];
}

export interface Student {
  id: string;
  /** Display code, e.g. "UL-10010" — unique among non-archived students. */
  matricNo: string;
  title: StudentTitle;
  firstName: string;
  middleName?: string;
  lastName: string;
  /** A distinct alternate/preferred name field, kept separate from Middle Name per the source record. */
  otherName?: string;
  gender: StudentGender;
  maritalStatus: MaritalStatus;
  email: string;
  phone: string;
  emergencyContact: string;
  /** ISO date. */
  dateOfBirth: string;
  religion: Religion;
  maidenName?: string;
  bloodGroup: BloodGroup;
  genotype: Genotype;
  weightKg: number;
  heightCm: number;
  nationality: string;
  stateOfOrigin: string;
  lga: string;
  residentAddress: string;
  /** Nullable — same convention as institution logo/user manager avatar (see `readFileAsDataUrl`). */
  avatarUrl?: string;
  /** FK to `School.id`. */
  schoolId: string;
  faculty: string;
  department: string;
  programme: string;
  currentLevel: StudentLevel;
  /** FK to `AcademicSession.id`. */
  currentSessionId: string;
  /** Enrollment status — independent of academic standing (isGraduating/isDeferred/holdForReview below). An inactive student is excluded from a rollover draft the same way an archived one would be. */
  status: StudentStatus;
  /** Completed the final level and all requirements — excluded from further rollover. */
  isGraduating: boolean;
  /** On an approved leave of absence — excluded from rollover until reinstated. */
  isDeferred: boolean;
  /** A case needing manual attention before rollover (disciplinary, incomplete records, etc.) — the engine suggests "hold" regardless of course results. */
  holdForReview: boolean;
  /** Append-only — a rollover adds a new entry, it never edits or removes a previous one. */
  academicHistory: StudentAcademicRecord[];
  createdAt: string;
  /** Nullable — soft-delete, same convention as every other admin table (archive, never hard delete). */
  archivedAt: string | null;
}

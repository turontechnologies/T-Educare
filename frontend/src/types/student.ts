export const STUDENT_LEVELS = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
  "500 Level",
] as const;

export type StudentLevel = (typeof STUDENT_LEVELS)[number];

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
  /** Display id, e.g. "STU/2022/0842". */
  studentId: string;
  name: string;
  programme: string;
  department: string;
  currentLevel: StudentLevel;
  /** FK to `AcademicSession.id`. */
  currentSessionId: string;
  /** Completed the final level and all requirements — excluded from further rollover. */
  isGraduating: boolean;
  /** On an approved leave of absence — excluded from rollover until reinstated. */
  isDeferred: boolean;
  /** A case needing manual attention before rollover (disciplinary, incomplete records, etc.) — the engine suggests "hold" regardless of course results. */
  holdForReview: boolean;
  /** Append-only — a rollover adds a new entry, it never edits or removes a previous one. */
  academicHistory: StudentAcademicRecord[];
}

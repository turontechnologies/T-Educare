export const ROLLOVER_DECISIONS = [
  "promote",
  "promote-carryover",
  "repeat",
  "deferred",
  "graduating",
  "hold",
] as const;

export type RolloverDecision = (typeof ROLLOVER_DECISIONS)[number];

/**
 * Rollover is still entirely a standalone frontend demo (never wired to
 * the real backend) — its own self-contained student shape, decoupled
 * from the real `Student` type in `types/student.ts`. The real backend
 * deliberately doesn't model per-course pass/fail results (that's
 * Results Management, a separate not-yet-built module), so Rollover's
 * "suggest promote/repeat from course results" engine has no real data
 * source to read from; it keeps demoing against its own seeded roster
 * instead (see `lib/rollover-seed.ts`).
 */
export const ROLLOVER_STUDENT_LEVELS = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
] as const;
export type RolloverStudentLevel = (typeof ROLLOVER_STUDENT_LEVELS)[number];

export interface RolloverCourseResult {
  courseCode: string;
  courseTitle: string;
  score: number;
  grade: string;
  passed: boolean;
  sessionId: string;
  attempt: number;
}

export interface RolloverAcademicRecord {
  sessionId: string;
  level: RolloverStudentLevel;
  status: "completed" | "current" | "repeat";
  courseResults: RolloverCourseResult[];
  carryoverCourses: string[];
}

export interface RolloverStudentProfile {
  id: string;
  matricNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  programme: string;
  currentLevel: RolloverStudentLevel;
  currentSessionId: string;
  status: "active" | "inactive";
  isGraduating: boolean;
  isDeferred: boolean;
  holdForReview: boolean;
  academicHistory: RolloverAcademicRecord[];
  archivedAt: string | null;
}

export interface RolloverStudentEntry {
  studentId: string;
  fromLevel: RolloverStudentLevel;
  /** Null when the student doesn't progress to a new level this cycle (deferred, graduating, or held). */
  toLevel: RolloverStudentLevel | null;
  passedCourses: string[];
  outstandingCourses: string[];
  /** The engine's computed recommendation — kept even after an admin override, for audit purposes. */
  suggestedDecision: RolloverDecision;
  /** What actually gets applied on confirm — starts equal to `suggestedDecision`. */
  decision: RolloverDecision;
  overridden: boolean;
  overrideReason?: string;
}

export interface RolloverRecord {
  id: string;
  fromSessionId: string;
  toSessionId: string;
  createdAt: string;
  /** Set only once the rollover is executed — a draft has `null` here and isn't in student history yet. */
  completedAt: string | null;
  status: "draft" | "completed";
  entries: RolloverStudentEntry[];
}

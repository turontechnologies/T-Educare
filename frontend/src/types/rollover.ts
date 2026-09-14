import type { StudentLevel } from "@/types/student";

export const ROLLOVER_DECISIONS = [
  "promote",
  "promote-carryover",
  "repeat",
  "deferred",
  "graduating",
  "hold",
] as const;

export type RolloverDecision = (typeof ROLLOVER_DECISIONS)[number];

export interface RolloverStudentEntry {
  studentId: string;
  fromLevel: StudentLevel;
  /** Null when the student doesn't progress to a new level this cycle (deferred, graduating, or held). */
  toLevel: StudentLevel | null;
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

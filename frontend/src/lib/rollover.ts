import type { RolloverDecision, RolloverStudentEntry } from "@/types/rollover";
import type {
  Student,
  StudentAcademicRecord,
  StudentLevel,
} from "@/types/student";

/**
 * Only these four levels have courses defined for this seed's single
 * programme (see `students.store.ts`) — "400 Level" is treated as the
 * exit level (graduation), not a step toward an unused "500 Level".
 */
const PROGRAMME_LEVEL_ORDER: StudentLevel[] = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
];

/** Null means "no next level" — i.e. this is the exit level. */
export function nextLevel(level: StudentLevel): StudentLevel | null {
  const index = PROGRAMME_LEVEL_ORDER.indexOf(level);
  if (index === -1 || index === PROGRAMME_LEVEL_ORDER.length - 1) return null;
  return PROGRAMME_LEVEL_ORDER[index + 1];
}

/** 3 or more outstanding courses means the level itself wasn't earned — repeat rather than carry them forward. */
const REPEAT_THRESHOLD = 3;

/**
 * Derives the destination level for a given decision — shared by the initial
 * suggestion and by a manual override, so changing a student's decision
 * always recomputes `toLevel` instead of leaving it stuck at whatever the
 * original suggestion resolved to.
 */
export function resolveToLevel(
  fromLevel: StudentLevel,
  decision: RolloverDecision,
): StudentLevel | null {
  if (decision === "promote" || decision === "promote-carryover") {
    return nextLevel(fromLevel);
  }
  if (decision === "repeat") {
    return fromLevel;
  }
  return null;
}

/**
 * The engine's recommendation for one student — pure and deterministic
 * given their latest academic record, so re-opening a rollover draft
 * always suggests the same thing until an admin overrides it.
 */
export function computeRolloverEntry(student: Student): RolloverStudentEntry {
  const latestRecord =
    student.academicHistory[student.academicHistory.length - 1];
  const passedCourses = latestRecord.courseResults
    .filter((c) => c.passed)
    .map((c) => c.courseCode);
  const outstandingCourses = latestRecord.carryoverCourses;
  const isExitLevel = nextLevel(student.currentLevel) === null;

  let suggestedDecision: RolloverDecision;

  if (student.isDeferred) {
    suggestedDecision = "deferred";
  } else if (student.holdForReview) {
    suggestedDecision = "hold";
  } else if (outstandingCourses.length >= REPEAT_THRESHOLD) {
    suggestedDecision = "repeat";
  } else if (isExitLevel) {
    // Can't promote further — either they're done, or their outstanding
    // courses need resolving before they can be marked complete.
    suggestedDecision = outstandingCourses.length === 0 ? "graduating" : "hold";
  } else if (outstandingCourses.length > 0) {
    suggestedDecision = "promote-carryover";
  } else {
    suggestedDecision = "promote";
  }

  const toLevel = resolveToLevel(student.currentLevel, suggestedDecision);

  return {
    studentId: student.id,
    fromLevel: student.currentLevel,
    toLevel,
    passedCourses,
    outstandingCourses,
    suggestedDecision,
    decision: suggestedDecision,
    overridden: false,
  };
}

/**
 * Produces the student's *new* state for the destination session —
 * history is always appended to, never rewritten. `deferred`/`hold`
 * students are returned completely untouched (they stay on the source
 * session until manually resolved in a future rollover).
 */
export function applyRolloverToStudent(
  student: Student,
  entry: RolloverStudentEntry,
  toSessionId: string,
): Student {
  if (entry.decision === "deferred" || entry.decision === "hold") {
    return student;
  }

  if (entry.decision === "graduating") {
    return { ...student, isGraduating: true };
  }

  const newLevel =
    entry.decision === "repeat"
      ? student.currentLevel
      : (entry.toLevel ?? student.currentLevel);

  const newRecord: StudentAcademicRecord = {
    sessionId: toSessionId,
    level: newLevel,
    status: entry.decision === "repeat" ? "repeat" : "current",
    courseResults: [],
    // A promoted-with-carryover student still owes their outstanding
    // courses at the new level — this is the "PROMOTED WITH CARRYOVER, not
    // REPEAT LEVEL" distinction the rollover exists to preserve.
    carryoverCourses:
      entry.decision === "promote-carryover" ? entry.outstandingCourses : [],
  };

  return {
    ...student,
    currentLevel: newLevel,
    currentSessionId: toSessionId,
    academicHistory: [...student.academicHistory, newRecord],
  };
}

export const ROLLOVER_DECISION_LABELS: Record<RolloverDecision, string> = {
  promote: "Promote",
  "promote-carryover": "Promote + Carryover",
  repeat: "Repeat",
  deferred: "Deferred",
  graduating: "Graduating",
  hold: "Hold for Review",
};

export const ROLLOVER_DECISION_BADGE_CLASS: Record<RolloverDecision, string> = {
  promote: "bg-emerald-500/10 text-emerald-600",
  "promote-carryover": "bg-amber-500/10 text-amber-600",
  repeat: "bg-destructive/10 text-destructive",
  deferred: "bg-muted text-muted-foreground",
  graduating: "bg-secondary/10 text-secondary",
  hold: "bg-orange-500/15 text-orange-600",
};

/**
 * A session/semester's lifecycle state — distinct from `archivedAt` (which
 * is purely soft-delete). "Upcoming" hasn't started, "active" is the one
 * currently running (see `isCurrent`), "completed" has ended and is
 * eligible for rollover (see `src/types/rollover.ts`).
 */
export type AcademicPeriodStatus = "upcoming" | "active" | "completed";

export interface AcademicSession {
  id: string;
  /** e.g. "2024/2025" */
  session: string;
  /** ISO date */
  from: string;
  /** ISO date */
  to: string;
  status: AcademicPeriodStatus;
  /** At most one session should be current at a time — see `setCurrentSession`. */
  isCurrent: boolean;
  createdAt: string;
  /** Soft-delete — archived sessions are hidden from the main list but never destroyed. ISO timestamp, or null if active. */
  archivedAt: string | null;
}

export interface AcademicSemester {
  id: string;
  /** FK to `AcademicSession.id`. */
  sessionId: string;
  name: string;
  description: string;
  /** ISO date */
  from: string;
  /** ISO date */
  to: string;
  status: AcademicPeriodStatus;
  /** At most one semester per session should be current at a time — see `setCurrentSemester`. */
  isCurrent: boolean;
  createdAt: string;
  /** Soft-delete — archived semesters are hidden from the main list but never destroyed. ISO timestamp, or null if active. */
  archivedAt: string | null;
}

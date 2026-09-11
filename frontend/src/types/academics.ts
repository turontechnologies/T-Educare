export interface AcademicSession {
  id: string;
  /** e.g. "2024/2025" */
  session: string;
  /** ISO date */
  from: string;
  /** ISO date */
  to: string;
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
  createdAt: string;
  /** Soft-delete — archived semesters are hidden from the main list but never destroyed. ISO timestamp, or null if active. */
  archivedAt: string | null;
}

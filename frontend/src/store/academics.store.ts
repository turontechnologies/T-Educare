import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AcademicSemester, AcademicSession } from "@/types/academics";

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Today's real date in this app's mock timeline is 2026-09 (see
 * frontend/CLAUDE.md) — 2026/2027 just started, so it's the current
 * session; 2025/2026 has just ended and hasn't been rolled over into it
 * yet, which is exactly the scenario the Session Rollover workflow
 * (`src/store/rollover.store.ts`) exists to walk an admin through.
 */
const SEEDED_SESSIONS: AcademicSession[] = [
  {
    id: "session-2023-2024",
    session: "2023/2024",
    from: "2023-09-01T00:00:00.000Z",
    to: "2024-07-31T00:00:00.000Z",
    status: "completed",
    isCurrent: false,
    createdAt: "2023-08-01T09:00:00.000Z",
    archivedAt: null,
  },
  {
    id: "session-2024-2025",
    session: "2024/2025",
    from: "2024-09-01T00:00:00.000Z",
    to: "2025-07-31T00:00:00.000Z",
    status: "completed",
    isCurrent: false,
    createdAt: "2024-08-01T09:00:00.000Z",
    archivedAt: null,
  },
  {
    id: "session-2025-2026",
    session: "2025/2026",
    from: "2025-09-01T00:00:00.000Z",
    to: "2026-07-31T00:00:00.000Z",
    status: "completed",
    isCurrent: false,
    createdAt: "2025-08-01T09:00:00.000Z",
    archivedAt: null,
  },
  {
    id: "session-2026-2027",
    session: "2026/2027",
    from: "2026-09-01T00:00:00.000Z",
    to: "2027-07-31T00:00:00.000Z",
    status: "active",
    isCurrent: true,
    createdAt: "2026-08-01T09:00:00.000Z",
    archivedAt: null,
  },
];

const SEEDED_SEMESTERS: AcademicSemester[] = [
  {
    id: "semester-2025-2026-1",
    sessionId: "session-2025-2026",
    name: "First Semester",
    description: "First semester of the 2025/2026 academic session.",
    from: "2025-09-01T00:00:00.000Z",
    to: "2026-01-16T00:00:00.000Z",
    status: "completed",
    isCurrent: false,
    createdAt: "2025-08-01T09:15:00.000Z",
    archivedAt: null,
  },
  {
    id: "semester-2025-2026-2",
    sessionId: "session-2025-2026",
    name: "Second Semester",
    description: "Second semester of the 2025/2026 academic session.",
    from: "2026-02-02T00:00:00.000Z",
    to: "2026-07-31T00:00:00.000Z",
    status: "completed",
    isCurrent: false,
    createdAt: "2025-08-01T09:20:00.000Z",
    archivedAt: null,
  },
  {
    id: "semester-2026-2027-1",
    sessionId: "session-2026-2027",
    name: "First Semester",
    description: "First semester of the 2026/2027 academic session.",
    from: "2026-09-01T00:00:00.000Z",
    to: "2027-01-15T00:00:00.000Z",
    status: "active",
    isCurrent: true,
    createdAt: "2026-08-01T09:15:00.000Z",
    archivedAt: null,
  },
  {
    id: "semester-2026-2027-2",
    sessionId: "session-2026-2027",
    name: "Second Semester",
    description: "Second semester of the 2026/2027 academic session.",
    from: "2027-02-01T00:00:00.000Z",
    to: "2027-07-31T00:00:00.000Z",
    status: "upcoming",
    isCurrent: false,
    createdAt: "2026-08-01T09:20:00.000Z",
    archivedAt: null,
  },
];

interface AcademicsState {
  sessions: AcademicSession[];
  semesters: AcademicSemester[];
  createSession: (
    session: Omit<
      AcademicSession,
      "id" | "createdAt" | "archivedAt" | "status" | "isCurrent"
    > & { status?: AcademicSession["status"] },
  ) => AcademicSession;
  updateSession: (id: string, patch: Partial<AcademicSession>) => void;
  archiveSession: (id: string) => void;
  restoreSession: (id: string) => void;
  /** Marks `id` as the one current session (unsetting every other session's `isCurrent`) and bumps it to "active" if it was still "upcoming". */
  setCurrentSession: (id: string) => void;
  /** Marks a session "completed" and no longer current — the point after which it's eligible for rollover. */
  closeSession: (id: string) => void;
  createSemester: (
    semester: Omit<
      AcademicSemester,
      "id" | "createdAt" | "archivedAt" | "status" | "isCurrent"
    > & { status?: AcademicSemester["status"] },
  ) => AcademicSemester;
  updateSemester: (id: string, patch: Partial<AcademicSemester>) => void;
  archiveSemester: (id: string) => void;
  restoreSemester: (id: string) => void;
  /** Marks `id` as the current semester *within its own session* (unsetting `isCurrent` on that session's other semesters only) and bumps it to "active" if "upcoming". */
  setCurrentSemester: (id: string) => void;
  /** Marks a semester "completed" and no longer current. */
  closeSemester: (id: string) => void;
}

export const useAcademicsStore = create<AcademicsState>()(
  persist(
    (set, get) => ({
      sessions: SEEDED_SESSIONS,
      semesters: SEEDED_SEMESTERS,

      createSession: (session) => {
        const newSession: AcademicSession = {
          ...session,
          status: session.status ?? "upcoming",
          isCurrent: false,
          id: makeId("session"),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({ sessions: [newSession, ...state.sessions] }));
        return newSession;
      },

      updateSession: (id, patch) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, ...patch } : session,
          ),
        }));
      },

      archiveSession: (id) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id
              ? { ...session, archivedAt: new Date().toISOString() }
              : session,
          ),
        }));
      },

      restoreSession: (id) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id ? { ...session, archivedAt: null } : session,
          ),
        }));
      },

      setCurrentSession: (id) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id
              ? {
                  ...session,
                  isCurrent: true,
                  status:
                    session.status === "upcoming" ? "active" : session.status,
                }
              : { ...session, isCurrent: false },
          ),
        }));
      },

      closeSession: (id) => {
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === id
              ? { ...session, status: "completed", isCurrent: false }
              : session,
          ),
        }));
      },

      createSemester: (semester) => {
        const newSemester: AcademicSemester = {
          ...semester,
          status: semester.status ?? "upcoming",
          isCurrent: false,
          id: makeId("semester"),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({ semesters: [newSemester, ...state.semesters] }));
        return newSemester;
      },

      updateSemester: (id, patch) => {
        set((state) => ({
          semesters: state.semesters.map((semester) =>
            semester.id === id ? { ...semester, ...patch } : semester,
          ),
        }));
      },

      archiveSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.map((semester) =>
            semester.id === id
              ? { ...semester, archivedAt: new Date().toISOString() }
              : semester,
          ),
        }));
      },

      restoreSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.map((semester) =>
            semester.id === id ? { ...semester, archivedAt: null } : semester,
          ),
        }));
      },

      setCurrentSemester: (id) => {
        const target = get().semesters.find((s) => s.id === id);
        if (!target) return;
        set((state) => ({
          semesters: state.semesters.map((semester) => {
            if (semester.id === id) {
              return {
                ...semester,
                isCurrent: true,
                status:
                  semester.status === "upcoming" ? "active" : semester.status,
              };
            }
            if (semester.sessionId === target.sessionId) {
              return { ...semester, isCurrent: false };
            }
            return semester;
          }),
        }));
      },

      closeSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.map((semester) =>
            semester.id === id
              ? { ...semester, status: "completed", isCurrent: false }
              : semester,
          ),
        }));
      },
    }),
    {
      name: "t-educare-academics",
      version: 3,
      // Mock data standing in for a real API (see frontend/CLAUDE.md) — a
      // version bump means "discard whatever was cached and reseed".
      migrate: () => ({
        sessions: SEEDED_SESSIONS,
        semesters: SEEDED_SEMESTERS,
      }),
    },
  ),
);

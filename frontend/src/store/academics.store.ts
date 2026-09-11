import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AcademicSemester, AcademicSession } from "@/types/academics";

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_SESSIONS: AcademicSession[] = [
  {
    id: "session-1",
    session: "2023/2024",
    from: "2023-09-01T00:00:00.000Z",
    to: "2024-07-31T00:00:00.000Z",
    createdAt: "2026-01-05T09:00:00.000Z",
    archivedAt: null,
  },
  {
    id: "session-2",
    session: "2024/2025",
    from: "2024-09-01T00:00:00.000Z",
    to: "2025-07-31T00:00:00.000Z",
    createdAt: "2026-01-06T09:00:00.000Z",
    archivedAt: null,
  },
];

const SEEDED_SEMESTERS: AcademicSemester[] = [
  {
    id: "semester-1",
    sessionId: "session-2",
    name: "First Semester",
    description: "First semester of the 2024/2025 academic session.",
    from: "2024-09-01T00:00:00.000Z",
    to: "2025-01-17T00:00:00.000Z",
    createdAt: "2026-01-06T09:15:00.000Z",
    archivedAt: null,
  },
  {
    id: "semester-2",
    sessionId: "session-2",
    name: "Second Semester",
    description: "Second semester of the 2024/2025 academic session.",
    from: "2025-02-03T00:00:00.000Z",
    to: "2025-07-31T00:00:00.000Z",
    createdAt: "2026-01-06T09:20:00.000Z",
    archivedAt: null,
  },
];

interface AcademicsState {
  sessions: AcademicSession[];
  semesters: AcademicSemester[];
  createSession: (
    session: Omit<AcademicSession, "id" | "createdAt" | "archivedAt">,
  ) => AcademicSession;
  updateSession: (id: string, patch: Partial<AcademicSession>) => void;
  archiveSession: (id: string) => void;
  restoreSession: (id: string) => void;
  createSemester: (
    semester: Omit<AcademicSemester, "id" | "createdAt" | "archivedAt">,
  ) => AcademicSemester;
  updateSemester: (id: string, patch: Partial<AcademicSemester>) => void;
  archiveSemester: (id: string) => void;
  restoreSemester: (id: string) => void;
}

export const useAcademicsStore = create<AcademicsState>()(
  persist(
    (set) => ({
      sessions: SEEDED_SESSIONS,
      semesters: SEEDED_SEMESTERS,

      createSession: (session) => {
        const newSession: AcademicSession = {
          ...session,
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

      createSemester: (semester) => {
        const newSemester: AcademicSemester = {
          ...semester,
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
    }),
    {
      name: "t-educare-academics",
      version: 2,
      // Mock data standing in for a real API (see frontend/CLAUDE.md) — a
      // version bump means "discard whatever was cached and reseed".
      migrate: () => ({
        sessions: SEEDED_SESSIONS,
        semesters: SEEDED_SEMESTERS,
      }),
    },
  ),
);

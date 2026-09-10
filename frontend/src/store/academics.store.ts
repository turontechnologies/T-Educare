import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AcademicSession {
  id: string;
  session: string;
  from: string;
  to: string;
}

export interface AcademicSemester {
  id: string;
  session: string;
  name: string;
  description: string;
  from: string;
  to: string;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_SESSIONS: AcademicSession[] = [
  {
    id: "session-1",
    session: "2019/2020",
    from: "17-03-2021",
    to: "20-03-2024",
  },
  {
    id: "session-2",
    session: "2020/2021",
    from: "17-03-2021",
    to: "20-03-2024",
  },
];

const SEEDED_SEMESTERS: AcademicSemester[] = [
  {
    id: "semester-1",
    session: "2019/2020",
    name: "First Semester",
    description: "First Semester",
    from: "17-03-2021",
    to: "20-03-2024",
  },
  {
    id: "semester-2",
    session: "2020/2021",
    name: "Second Semester",
    description: "Second Semester",
    from: "17-03-2021",
    to: "20-03-2024",
  },
];

interface AcademicsState {
  sessions: AcademicSession[];
  semesters: AcademicSemester[];
  createSession: (session: Omit<AcademicSession, "id">) => void;
  deleteSession: (id: string) => void;
  createSemester: (semester: Omit<AcademicSemester, "id">) => void;
  deleteSemester: (id: string) => void;
}

export const useAcademicsStore = create<AcademicsState>()(
  persist(
    (set) => ({
      sessions: SEEDED_SESSIONS,
      semesters: SEEDED_SEMESTERS,

      createSession: (session) => {
        set((state) => ({
          sessions: [...state.sessions, { ...session, id: makeId("session") }],
        }));
      },
      deleteSession: (id) => {
        set((state) => ({
          sessions: state.sessions.filter((session) => session.id !== id),
        }));
      },

      createSemester: (semester) => {
        set((state) => ({
          semesters: [
            ...state.semesters,
            { ...semester, id: makeId("semester") },
          ],
        }));
      },
      deleteSemester: (id) => {
        set((state) => ({
          semesters: state.semesters.filter((semester) => semester.id !== id),
        }));
      },
    }),
    {
      name: "t-educare-academics",
      version: 1,
      // Discard-and-reseed on a shape change — see the identical note in
      // institutions.store.ts.
      migrate: () => ({
        sessions: SEEDED_SESSIONS,
        semesters: SEEDED_SEMESTERS,
      }),
    },
  ),
);

import { create } from "zustand";
import type { AcademicSemester, AcademicSession } from "@/types/academics";

interface AcademicsState {
  sessions: AcademicSession[];
  semesters: AcademicSemester[];
  /**
   * Called after every academic-sessions/-semesters fetch (see
   * `dashboard/layout.tsx`) to hydrate this store with real, server-backed
   * data — same "fetch then setX" convention `institutions.store.ts` uses.
   * Never seeded/mocked; empty until the first fetch resolves. Students
   * (`students.store.ts`) and Session Rollover (`rollover.store.ts`) both
   * still only *read* `sessions`/`semesters` from here for their own
   * dropdowns/lookups — neither is itself backed by a real API yet, so
   * this store staying real underneath them needs no changes on their side.
   * Write through the real mutation hooks in `hooks/use-academic-sessions.ts`
   * / `hooks/use-academic-semesters.ts` and let the next fetch update this
   * store, never by patching it directly.
   */
  setSessions: (sessions: AcademicSession[]) => void;
  setSemesters: (semesters: AcademicSemester[]) => void;
}

export const useAcademicsStore = create<AcademicsState>()((set) => ({
  sessions: [],
  semesters: [],

  setSessions: (sessions) => set({ sessions }),
  setSemesters: (semesters) => set({ semesters }),
}));

import { create } from "zustand";
import type { Faculty } from "@/types/faculty";

/**
 * Fixed ids that Departments/Programs/Lecturers (all still frontend-mocked,
 * no real backend yet) hardcode as their own `facultyId`/`assignmentId`
 * seed values — same reasoning as `schools.store.ts`'s `SEED_SCHOOL_IDS`.
 * Kept here as plain constants, independent of the real `faculties` list
 * below, purely so those still-mock stores keep compiling and stay
 * internally consistent among themselves. Their seeded demo rows will show
 * a blank "Faculty" (no match in the real, per-institution list) until
 * each of those pages gets its own real backend — a known, accepted gap,
 * not a bug (confirmed with the user for the identical Schools situation;
 * applied the same resolution here rather than re-asking).
 */
export const SEED_FACULTY_IDS = {
  law: "faculty-law",
  computing: "faculty-computing",
  mathematics: "faculty-mathematics",
} as const;

interface FacultiesState {
  faculties: Faculty[];
  /**
   * Called after every /faculties fetch (see `dashboard/layout.tsx`) to
   * hydrate this store with real, server-backed data — same "fetch then
   * setX" convention `schools.store.ts`/`academics.store.ts` use. Never
   * seeded/mocked; empty until the first fetch resolves. Write through the
   * real mutation hooks in `hooks/use-faculties.ts` and let the next fetch
   * update this store, never by patching it directly.
   */
  setFaculties: (faculties: Faculty[]) => void;
}

export const useFacultiesStore = create<FacultiesState>()((set) => ({
  faculties: [],

  setFaculties: (faculties) => set({ faculties }),
}));

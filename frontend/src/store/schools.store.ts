import { create } from "zustand";
import type { School } from "@/types/school";

/**
 * Fixed ids that Faculties/Departments/Courses/Lecturers/Students (all
 * still frontend-mocked, no real backend yet) hardcode as their own
 * `schoolId`/`assignmentId` seed values. Kept here as plain constants —
 * independent of the real `schools` list below — purely so those five
 * still-mock stores keep compiling and stay internally consistent among
 * themselves. Their seeded demo rows will show a blank "School" (no
 * match in the real, per-institution list) until each of those pages
 * gets its own real backend — a known, accepted gap, not a bug.
 */
export const SEED_SCHOOL_IDS = {
  engineering: "school-engineering",
  computing: "school-computing",
  technology: "school-technology",
  statistics: "school-statistics",
} as const;

interface SchoolsState {
  schools: School[];
  /**
   * Called after every /schools fetch (see `dashboard/layout.tsx`) to
   * hydrate this store with real, server-backed data — same "fetch then
   * setX" convention `institutions.store.ts`/`academics.store.ts` use.
   * Never seeded/mocked; empty until the first fetch resolves. Write
   * through the real mutation hooks in `hooks/use-schools.ts` and let the
   * next fetch update this store, never by patching it directly.
   */
  setSchools: (schools: School[]) => void;
}

export const useSchoolsStore = create<SchoolsState>()((set) => ({
  schools: [],

  setSchools: (schools) => set({ schools }),
}));

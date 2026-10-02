import { create } from "zustand";
import type { Department } from "@/types/department";

/**
 * Fixed ids that Programs/Courses/Staff Members (all still frontend-mocked,
 * no real backend yet) hardcode as their own `departmentId` seed values —
 * same reasoning as `schools.store.ts`'s `SEED_SCHOOL_IDS` and
 * `faculties.store.ts`'s `SEED_FACULTY_IDS`. Kept here as plain constants,
 * independent of the real `departments` list below, purely so those
 * still-mock stores keep compiling and stay internally consistent among
 * themselves. Their seeded demo rows will show a blank "Department" (no
 * match in the real, per-institution list) until each of those pages gets
 * its own real backend — a known, accepted gap, not a bug (same resolution
 * the user confirmed once for Schools and applied again for Faculties
 * without re-asking; applied the same way here a third time).
 */
export const SEED_DEPARTMENT_IDS = {
  mathematics: "department-mathematics",
  law: "department-law",
  computing: "department-computing",
  administration: "department-administration",
  computerStudies: "department-computer-studies",
  statistics: "department-statistics",
  accounting: "department-accounting",
} as const;

interface DepartmentsState {
  departments: Department[];
  /**
   * Called after every /departments fetch (see `dashboard/layout.tsx`) to
   * hydrate this store with real, server-backed data — same "fetch then
   * setX" convention `schools.store.ts`/`faculties.store.ts` use. Never
   * seeded/mocked; empty until the first fetch resolves. Write through the
   * real mutation hooks in `hooks/use-departments.ts` and let the next
   * fetch update this store, never by patching it directly.
   */
  setDepartments: (departments: Department[]) => void;
}

export const useDepartmentsStore = create<DepartmentsState>()((set) => ({
  departments: [],

  setDepartments: (departments) => set({ departments }),
}));

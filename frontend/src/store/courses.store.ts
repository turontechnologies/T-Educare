import { create } from "zustand";
import type { Course } from "@/types/course";

interface CoursesState {
  courses: Course[];
  /**
   * Called after every /courses fetch (see `dashboard/layout.tsx`) to
   * hydrate this store with real, server-backed data — same "fetch then
   * setX" convention `programs.store.ts`/`departments.store.ts` use.
   * Never seeded/mocked; empty until the first fetch resolves. Write
   * through the real mutation hooks in `hooks/use-courses.ts` and let
   * the next fetch update this store, never by patching it directly.
   * No `SEED_COURSE_IDS` export needed — Courses is a leaf resource in
   * this hierarchy, nothing else FKs to it.
   */
  setCourses: (courses: Course[]) => void;
}

export const useCoursesStore = create<CoursesState>()((set) => ({
  courses: [],

  setCourses: (courses) => set({ courses }),
}));

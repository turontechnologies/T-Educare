import { create } from "zustand";
import type { CourseGrade } from "@/types/course-grade";

interface CourseGradesState {
  courseGrades: CourseGrade[];
  /** The separate `/grading-scale` setting (API_CONTRACT.md §7.9) — kept alongside `courseGrades` in one store, same shape the pre-backend mock already used, even though each is now hydrated from its own real endpoint. */
  maxGradePoint: number;
  /**
   * Called after every /course-grades fetch (see `dashboard/layout.tsx`)
   * to hydrate this store with real, server-backed data — same "fetch
   * then setX" convention `programs.store.ts`/`departments.store.ts` use.
   * Never seeded/mocked; empty until the first fetch resolves. Write
   * through the real mutation hooks in `hooks/use-course-grades.ts` and
   * let the next fetch update this store, never by patching it directly.
   */
  setCourseGrades: (courseGrades: CourseGrade[]) => void;
  /** Called after every /grading-scale fetch — see `hooks/use-grading-scale.ts`, a genuinely separate real resource from courseGrades above. */
  setMaxGradePoint: (value: number) => void;
}

export const useCourseGradesStore = create<CourseGradesState>()((set) => ({
  courseGrades: [],
  maxGradePoint: 5,

  setCourseGrades: (courseGrades) => set({ courseGrades }),
  setMaxGradePoint: (value) => set({ maxGradePoint: value }),
}));

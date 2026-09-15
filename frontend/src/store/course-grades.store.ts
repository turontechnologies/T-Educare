import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CourseGrade } from "@/types/course-grade";

function makeId() {
  return `course-grade-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_COURSE_GRADES: CourseGrade[] = [
  {
    id: makeId(),
    code: "A",
    remark: "Distinction",
    gradeScore: 5,
    minimumScore: 70,
    maximumScore: 100,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: makeId(),
    code: "AB",
    remark: "Very Good",
    gradeScore: 4.5,
    minimumScore: 65,
    maximumScore: 69.99,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
];

interface CourseGradesState {
  courseGrades: CourseGrade[];
  /** A single grading-scale-wide setting shown alongside the table, not a per-row field. */
  maxGradePoint: number;
  setMaxGradePoint: (value: number) => void;
  createCourseGrade: (
    courseGrade: Omit<CourseGrade, "id" | "createdAt" | "archivedAt">,
  ) => CourseGrade;
  updateCourseGrade: (id: string, patch: Partial<CourseGrade>) => void;
  archiveCourseGrade: (id: string) => void;
  restoreCourseGrade: (id: string) => void;
}

export const useCourseGradesStore = create<CourseGradesState>()(
  persist(
    (set) => ({
      courseGrades: SEEDED_COURSE_GRADES,
      maxGradePoint: 5,
      setMaxGradePoint: (value) => set({ maxGradePoint: value }),

      createCourseGrade: (courseGrade) => {
        const newCourseGrade: CourseGrade = {
          ...courseGrade,
          id: makeId(),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({
          courseGrades: [newCourseGrade, ...state.courseGrades],
        }));
        return newCourseGrade;
      },

      updateCourseGrade: (id, patch) => {
        set((state) => ({
          courseGrades: state.courseGrades.map((courseGrade) =>
            courseGrade.id === id ? { ...courseGrade, ...patch } : courseGrade,
          ),
        }));
      },

      archiveCourseGrade: (id) => {
        set((state) => ({
          courseGrades: state.courseGrades.map((courseGrade) =>
            courseGrade.id === id
              ? { ...courseGrade, archivedAt: new Date().toISOString() }
              : courseGrade,
          ),
        }));
      },

      restoreCourseGrade: (id) => {
        set((state) => ({
          courseGrades: state.courseGrades.map((courseGrade) =>
            courseGrade.id === id
              ? { ...courseGrade, archivedAt: null }
              : courseGrade,
          ),
        }));
      },
    }),
    {
      name: "t-educare-course-grades",
      version: 1,
      migrate: () => ({
        courseGrades: SEEDED_COURSE_GRADES,
        maxGradePoint: 5,
      }),
    },
  ),
);

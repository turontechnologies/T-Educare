import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_DEPARTMENT_IDS } from "@/store/departments.store";
import { SEED_SCHOOL_IDS } from "@/store/schools.store";
import type { Course } from "@/types/course";

function makeId() {
  return `course-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_COURSES: Course[] = [
  {
    id: makeId(),
    name: "Pure Mathematics",
    code: "MAT101",
    departmentId: SEED_DEPARTMENT_IDS.computerStudies,
    schoolId: SEED_SCHOOL_IDS.technology,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: makeId(),
    name: "General Studies",
    code: "GST101",
    departmentId: SEED_DEPARTMENT_IDS.statistics,
    schoolId: SEED_SCHOOL_IDS.statistics,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
];

interface CoursesState {
  courses: Course[];
  createCourse: (
    course: Omit<Course, "id" | "createdAt" | "archivedAt">,
  ) => Course;
  updateCourse: (id: string, patch: Partial<Course>) => void;
  archiveCourse: (id: string) => void;
  restoreCourse: (id: string) => void;
}

export const useCoursesStore = create<CoursesState>()(
  persist(
    (set) => ({
      courses: SEEDED_COURSES,

      createCourse: (course) => {
        const newCourse: Course = {
          ...course,
          id: makeId(),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({ courses: [newCourse, ...state.courses] }));
        return newCourse;
      },

      updateCourse: (id, patch) => {
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === id ? { ...course, ...patch } : course,
          ),
        }));
      },

      archiveCourse: (id) => {
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === id
              ? { ...course, archivedAt: new Date().toISOString() }
              : course,
          ),
        }));
      },

      restoreCourse: (id) => {
        set((state) => ({
          courses: state.courses.map((course) =>
            course.id === id ? { ...course, archivedAt: null } : course,
          ),
        }));
      },
    }),
    {
      name: "t-educare-courses",
      version: 1,
      migrate: () => ({ courses: SEEDED_COURSES }),
    },
  ),
);

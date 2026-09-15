import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_SCHOOL_IDS } from "@/store/schools.store";
import type { Faculty } from "@/types/faculty";

function makeId() {
  return `faculty-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Fixed, stable ids for the seeded rows (not `makeId()`) so other mock stores — Department Management's `facultyId` FK — can reference them reliably. */
export const SEED_FACULTY_IDS = {
  law: "faculty-law",
  computing: "faculty-computing",
  mathematics: "faculty-mathematics",
} as const;

const SEEDED_FACULTIES: Faculty[] = [
  {
    id: SEED_FACULTY_IDS.law,
    name: "Faculty of Law",
    deanName: "Dr. Solomon Olusegun",
    schoolId: SEED_SCHOOL_IDS.engineering,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: SEED_FACULTY_IDS.computing,
    name: "Faculty of Computing",
    deanName: "Alh. Gbenga Olusegun",
    schoolId: SEED_SCHOOL_IDS.computing,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: SEED_FACULTY_IDS.mathematics,
    name: "Faculty of Mathematics",
    deanName: "Dr. Solomon Olusegun",
    schoolId: SEED_SCHOOL_IDS.engineering,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
];

interface FacultiesState {
  faculties: Faculty[];
  createFaculty: (
    faculty: Omit<Faculty, "id" | "createdAt" | "archivedAt">,
  ) => Faculty;
  updateFaculty: (id: string, patch: Partial<Faculty>) => void;
  archiveFaculty: (id: string) => void;
  restoreFaculty: (id: string) => void;
}

export const useFacultiesStore = create<FacultiesState>()(
  persist(
    (set) => ({
      faculties: SEEDED_FACULTIES,

      createFaculty: (faculty) => {
        const newFaculty: Faculty = {
          ...faculty,
          id: makeId(),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({ faculties: [newFaculty, ...state.faculties] }));
        return newFaculty;
      },

      updateFaculty: (id, patch) => {
        set((state) => ({
          faculties: state.faculties.map((faculty) =>
            faculty.id === id ? { ...faculty, ...patch } : faculty,
          ),
        }));
      },

      archiveFaculty: (id) => {
        set((state) => ({
          faculties: state.faculties.map((faculty) =>
            faculty.id === id
              ? { ...faculty, archivedAt: new Date().toISOString() }
              : faculty,
          ),
        }));
      },

      restoreFaculty: (id) => {
        set((state) => ({
          faculties: state.faculties.map((faculty) =>
            faculty.id === id ? { ...faculty, archivedAt: null } : faculty,
          ),
        }));
      },
    }),
    {
      name: "t-educare-faculties",
      version: 2,
      migrate: () => ({ faculties: SEEDED_FACULTIES }),
    },
  ),
);

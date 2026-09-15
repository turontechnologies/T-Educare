import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { School } from "@/types/school";

function makeId() {
  return `school-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Fixed, stable ids for the seeded rows (not `makeId()`) so other mock stores — Student Management's `schoolId` FK — can reference them reliably. */
export const SEED_SCHOOL_IDS = {
  engineering: "school-engineering",
  computing: "school-computing",
  technology: "school-technology",
  statistics: "school-statistics",
} as const;

const SEEDED_SCHOOLS: School[] = [
  {
    id: SEED_SCHOOL_IDS.engineering,
    name: "School of Engineering",
    headName: "Alh. Mustapha George",
    designation: "HOD",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: SEED_SCHOOL_IDS.computing,
    name: "School of Computing",
    headName: "Alh. Gbenga Olusegun",
    designation: "Vice Chancellor",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: SEED_SCHOOL_IDS.technology,
    name: "School of Technology",
    headName: "Prof. Ngozi Eze",
    designation: "Provost",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: SEED_SCHOOL_IDS.statistics,
    name: "School of Statistics",
    headName: "Dr. Amina Bello",
    designation: "HOD",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
];

interface SchoolsState {
  schools: School[];
  createSchool: (
    school: Omit<School, "id" | "createdAt" | "archivedAt">,
  ) => School;
  updateSchool: (id: string, patch: Partial<School>) => void;
  archiveSchool: (id: string) => void;
  restoreSchool: (id: string) => void;
}

export const useSchoolsStore = create<SchoolsState>()(
  persist(
    (set) => ({
      schools: SEEDED_SCHOOLS,

      createSchool: (school) => {
        const newSchool: School = {
          ...school,
          id: makeId(),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({ schools: [newSchool, ...state.schools] }));
        return newSchool;
      },

      updateSchool: (id, patch) => {
        set((state) => ({
          schools: state.schools.map((school) =>
            school.id === id ? { ...school, ...patch } : school,
          ),
        }));
      },

      archiveSchool: (id) => {
        set((state) => ({
          schools: state.schools.map((school) =>
            school.id === id
              ? { ...school, archivedAt: new Date().toISOString() }
              : school,
          ),
        }));
      },

      restoreSchool: (id) => {
        set((state) => ({
          schools: state.schools.map((school) =>
            school.id === id ? { ...school, archivedAt: null } : school,
          ),
        }));
      },
    }),
    {
      name: "t-educare-schools",
      version: 2,
      migrate: () => ({ schools: SEEDED_SCHOOLS }),
    },
  ),
);

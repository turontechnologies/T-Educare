import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_FACULTY_IDS } from "@/store/faculties.store";
import { SEED_SCHOOL_IDS } from "@/store/schools.store";
import type { Department } from "@/types/department";

function makeId() {
  return `department-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Fixed, stable ids for the seeded rows (not `makeId()`) so other mock stores — Program Management's `departmentId` FK — can reference them reliably. */
export const SEED_DEPARTMENT_IDS = {
  mathematics: "department-mathematics",
  law: "department-law",
  computing: "department-computing",
  administration: "department-administration",
} as const;

const SEEDED_DEPARTMENTS: Department[] = [
  {
    id: SEED_DEPARTMENT_IDS.mathematics,
    name: "Mathematics Department",
    hodName: "Dr. Solomon Olusegun",
    facultyId: SEED_FACULTY_IDS.mathematics,
    schoolId: SEED_SCHOOL_IDS.engineering,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: SEED_DEPARTMENT_IDS.law,
    name: "Law Department",
    hodName: "Alh. Gbenga Olusegun",
    facultyId: SEED_FACULTY_IDS.law,
    schoolId: SEED_SCHOOL_IDS.computing,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: SEED_DEPARTMENT_IDS.computing,
    name: "Computing Department",
    hodName: "Alh. Gbenga Olusegun",
    facultyId: SEED_FACULTY_IDS.mathematics,
    schoolId: SEED_SCHOOL_IDS.engineering,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: SEED_DEPARTMENT_IDS.administration,
    name: "Administration Department",
    hodName: "Dr. Solomon Olusegun",
    facultyId: SEED_FACULTY_IDS.law,
    schoolId: SEED_SCHOOL_IDS.engineering,
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
];

interface DepartmentsState {
  departments: Department[];
  createDepartment: (
    department: Omit<Department, "id" | "createdAt" | "archivedAt">,
  ) => Department;
  updateDepartment: (id: string, patch: Partial<Department>) => void;
  archiveDepartment: (id: string) => void;
  restoreDepartment: (id: string) => void;
}

export const useDepartmentsStore = create<DepartmentsState>()(
  persist(
    (set) => ({
      departments: SEEDED_DEPARTMENTS,

      createDepartment: (department) => {
        const newDepartment: Department = {
          ...department,
          id: makeId(),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({
          departments: [newDepartment, ...state.departments],
        }));
        return newDepartment;
      },

      updateDepartment: (id, patch) => {
        set((state) => ({
          departments: state.departments.map((department) =>
            department.id === id ? { ...department, ...patch } : department,
          ),
        }));
      },

      archiveDepartment: (id) => {
        set((state) => ({
          departments: state.departments.map((department) =>
            department.id === id
              ? { ...department, archivedAt: new Date().toISOString() }
              : department,
          ),
        }));
      },

      restoreDepartment: (id) => {
        set((state) => ({
          departments: state.departments.map((department) =>
            department.id === id
              ? { ...department, archivedAt: null }
              : department,
          ),
        }));
      },
    }),
    {
      name: "t-educare-departments",
      version: 2,
      migrate: () => ({ departments: SEEDED_DEPARTMENTS }),
    },
  ),
);

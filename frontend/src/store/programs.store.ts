import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SEED_DEPARTMENT_IDS } from "@/store/departments.store";
import { SEED_FACULTY_IDS } from "@/store/faculties.store";
import type { Program } from "@/types/program";

function makeId() {
  return `program-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_PROGRAMS: Program[] = [
  {
    id: makeId(),
    name: "Computing and IT",
    departmentId: SEED_DEPARTMENT_IDS.computing,
    facultyId: SEED_FACULTY_IDS.mathematics,
    programType: "Undergraduate",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: makeId(),
    name: "Business Admin",
    departmentId: SEED_DEPARTMENT_IDS.administration,
    facultyId: SEED_FACULTY_IDS.law,
    programType: "Postgraduate",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
];

interface ProgramsState {
  programs: Program[];
  createProgram: (
    program: Omit<Program, "id" | "createdAt" | "archivedAt">,
  ) => Program;
  updateProgram: (id: string, patch: Partial<Program>) => void;
  archiveProgram: (id: string) => void;
  restoreProgram: (id: string) => void;
}

export const useProgramsStore = create<ProgramsState>()(
  persist(
    (set) => ({
      programs: SEEDED_PROGRAMS,

      createProgram: (program) => {
        const newProgram: Program = {
          ...program,
          id: makeId(),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({ programs: [newProgram, ...state.programs] }));
        return newProgram;
      },

      updateProgram: (id, patch) => {
        set((state) => ({
          programs: state.programs.map((program) =>
            program.id === id ? { ...program, ...patch } : program,
          ),
        }));
      },

      archiveProgram: (id) => {
        set((state) => ({
          programs: state.programs.map((program) =>
            program.id === id
              ? { ...program, archivedAt: new Date().toISOString() }
              : program,
          ),
        }));
      },

      restoreProgram: (id) => {
        set((state) => ({
          programs: state.programs.map((program) =>
            program.id === id ? { ...program, archivedAt: null } : program,
          ),
        }));
      },
    }),
    {
      name: "t-educare-programs",
      version: 1,
      migrate: () => ({ programs: SEEDED_PROGRAMS }),
    },
  ),
);

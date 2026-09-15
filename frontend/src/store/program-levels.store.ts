import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProgramLevel } from "@/types/program-level";

function makeId() {
  return `program-level-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEEDED_PROGRAM_LEVELS: ProgramLevel[] = [
  {
    id: makeId(),
    levelCode: "100",
    description: "100 levels",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
  {
    id: makeId(),
    levelCode: "200",
    description: "200 levels",
    createdAt: new Date("2021-03-09T00:00:00.000Z").toISOString(),
    archivedAt: null,
  },
];

interface ProgramLevelsState {
  programLevels: ProgramLevel[];
  createProgramLevel: (
    programLevel: Omit<ProgramLevel, "id" | "createdAt" | "archivedAt">,
  ) => ProgramLevel;
  updateProgramLevel: (id: string, patch: Partial<ProgramLevel>) => void;
  archiveProgramLevel: (id: string) => void;
  restoreProgramLevel: (id: string) => void;
}

export const useProgramLevelsStore = create<ProgramLevelsState>()(
  persist(
    (set) => ({
      programLevels: SEEDED_PROGRAM_LEVELS,

      createProgramLevel: (programLevel) => {
        const newProgramLevel: ProgramLevel = {
          ...programLevel,
          id: makeId(),
          createdAt: new Date().toISOString(),
          archivedAt: null,
        };
        set((state) => ({
          programLevels: [newProgramLevel, ...state.programLevels],
        }));
        return newProgramLevel;
      },

      updateProgramLevel: (id, patch) => {
        set((state) => ({
          programLevels: state.programLevels.map((programLevel) =>
            programLevel.id === id
              ? { ...programLevel, ...patch }
              : programLevel,
          ),
        }));
      },

      archiveProgramLevel: (id) => {
        set((state) => ({
          programLevels: state.programLevels.map((programLevel) =>
            programLevel.id === id
              ? { ...programLevel, archivedAt: new Date().toISOString() }
              : programLevel,
          ),
        }));
      },

      restoreProgramLevel: (id) => {
        set((state) => ({
          programLevels: state.programLevels.map((programLevel) =>
            programLevel.id === id
              ? { ...programLevel, archivedAt: null }
              : programLevel,
          ),
        }));
      },
    }),
    {
      name: "t-educare-program-levels",
      version: 1,
      migrate: () => ({ programLevels: SEEDED_PROGRAM_LEVELS }),
    },
  ),
);

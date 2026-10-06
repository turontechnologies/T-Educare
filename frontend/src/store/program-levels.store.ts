import { create } from "zustand";
import type { ProgramLevel } from "@/types/program-level";

interface ProgramLevelsState {
  programLevels: ProgramLevel[];
  /**
   * Called after every /program-levels fetch (see `dashboard/layout.tsx`)
   * to hydrate this store with real, server-backed data — same "fetch
   * then setX" convention `programs.store.ts`/`departments.store.ts` use.
   * Never seeded/mocked; empty until the first fetch resolves. Write
   * through the real mutation hooks in `hooks/use-program-levels.ts` and
   * let the next fetch update this store, never by patching it directly.
   * No `SEED_PROGRAM_LEVEL_IDS` export needed — this is a deliberately
   * independent lookup table (API_CONTRACT.md §7.8), not FK'd to or from
   * anything else.
   */
  setProgramLevels: (programLevels: ProgramLevel[]) => void;
}

export const useProgramLevelsStore = create<ProgramLevelsState>()((set) => ({
  programLevels: [],

  setProgramLevels: (programLevels) => set({ programLevels }),
}));

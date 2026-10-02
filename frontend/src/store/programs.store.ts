import { create } from "zustand";
import type { Program } from "@/types/program";

interface ProgramsState {
  programs: Program[];
  /**
   * Called after every /programs fetch (see `dashboard/layout.tsx`) to
   * hydrate this store with real, server-backed data — same "fetch then
   * setX" convention `departments.store.ts`/`faculties.store.ts` use.
   * Never seeded/mocked; empty until the first fetch resolves. Write
   * through the real mutation hooks in `hooks/use-programs.ts` and let the
   * next fetch update this store, never by patching it directly. Unlike
   * Schools/Faculties/Departments, no other mock store references a
   * Program by a fixed seed id (Program Levels, §7.8, is a deliberately
   * independent lookup table — see types/program-level.ts), so there's no
   * `SEED_PROGRAM_IDS` export to carry forward here.
   */
  setPrograms: (programs: Program[]) => void;
}

export const useProgramsStore = create<ProgramsState>()((set) => ({
  programs: [],

  setPrograms: (programs) => set({ programs }),
}));

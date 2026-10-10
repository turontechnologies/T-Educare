import { create } from "zustand";
import type { Lecturer } from "@/types/lecturer";

interface LecturersState {
  lecturers: Lecturer[];
  /**
   * Hydrated from the real backend by `dashboard/layout.tsx` via
   * `useLecturers` — never seeded/mocked. Write through the real mutation
   * hooks in `hooks/use-lecturers.ts` and let the next fetch update this
   * store, never by patching it directly (same convention as
   * `staff-members.store.ts`).
   */
  setLecturers: (lecturers: Lecturer[]) => void;
}

export const useLecturersStore = create<LecturersState>()((set) => ({
  lecturers: [],
  setLecturers: (lecturers) => set({ lecturers }),
}));

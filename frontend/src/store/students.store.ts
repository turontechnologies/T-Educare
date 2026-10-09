import { create } from "zustand";
import type { Student } from "@/types/student";

interface StudentsState {
  students: Student[];
  /**
   * Hydrated from the real backend by `dashboard/layout.tsx` via
   * `useStudents` — never seeded/mocked. Write through the real mutation
   * hooks in `hooks/use-students.ts` and let the next fetch update this
   * store, never by patching it directly (same convention as every other
   * real-backend resource in this app).
   */
  setStudents: (students: Student[]) => void;
}

export const useStudentsStore = create<StudentsState>()((set) => ({
  students: [],
  setStudents: (students) => set({ students }),
}));

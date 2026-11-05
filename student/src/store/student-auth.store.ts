import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StudentAuthProfile } from "@/types/student-auth";

interface StudentAuthState {
  student: StudentAuthProfile | null;
  /** The bearer token issued at login — attached to every API request by lib/axios.ts. */
  token: string | null;
  hasHydrated: boolean;
  setStudent: (student: StudentAuthProfile | null) => void;
  setToken: (token: string | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  logout: () => void;
}

export const useStudentAuthStore = create<StudentAuthState>()(
  persist(
    (set) => ({
      student: null,
      token: null,
      hasHydrated: false,
      setStudent: (student) => set({ student }),
      setToken: (token) => set({ token }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => set({ student: null, token: null }),
    }),
    {
      name: "t-educare-student-auth",
      version: 1,
      partialize: (state) => ({ student: state.student, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

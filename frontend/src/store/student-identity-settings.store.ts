import { create } from "zustand";
import type { StudentIdentitySettings } from "@/types/student";

interface StudentIdentitySettingsState {
  settings: StudentIdentitySettings;
  /** Hydrated from the real backend by `dashboard/layout.tsx` via `useStudentIdentitySettings` — read by student-details-dialog.tsx and the students list page to decide which pre-student identifier to show as primary. */
  setSettings: (settings: StudentIdentitySettings) => void;
}

export const useStudentIdentitySettingsStore =
  create<StudentIdentitySettingsState>()((set) => ({
    settings: { preStudentIdentifierPreference: "PRE_ADMISSION_ID" },
    setSettings: (settings) => set({ settings }),
  }));

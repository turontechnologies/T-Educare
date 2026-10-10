import { create } from "zustand";
import type { LectureAssignment } from "@/types/lecturer";

interface LectureAssignmentsState {
  assignments: LectureAssignment[];
  /** Hydrated from the real backend by `dashboard/layout.tsx` via `useLectureAssignments` — never seeded/mocked. */
  setAssignments: (assignments: LectureAssignment[]) => void;
}

export const useLectureAssignmentsStore = create<LectureAssignmentsState>()(
  (set) => ({
    assignments: [],
    setAssignments: (assignments) => set({ assignments }),
  }),
);

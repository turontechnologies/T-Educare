import { create } from "zustand";
import type { StaffDesignation } from "@/types/staff-designation";

export type {
  StaffCategory,
  StaffDesignation,
} from "@/types/staff-designation";

interface StaffState {
  designations: StaffDesignation[];
  /**
   * Hydrated from the real backend by `dashboard/layout.tsx` via
   * `useStaffDesignations` — never seeded/mocked. Write through the real
   * mutation hooks in `hooks/use-staff-designations.ts` and let the next
   * fetch update this store, never by patching it directly (same
   * convention as every other real-backend resource in this app).
   * Reused by `school-dialog.tsx`'s "Designation" select — any shape
   * change here must be checked against that consumer too.
   */
  setDesignations: (designations: StaffDesignation[]) => void;
}

export const useStaffStore = create<StaffState>()((set) => ({
  designations: [],
  setDesignations: (designations) => set({ designations }),
}));

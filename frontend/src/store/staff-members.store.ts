import { create } from "zustand";
import type { StaffMember } from "@/types/staff-member";

interface StaffMembersState {
  staffMembers: StaffMember[];
  /**
   * Hydrated from the real backend by `dashboard/layout.tsx` via
   * `useStaffMembers` — never seeded/mocked. Write through the real
   * mutation hooks in `hooks/use-staff-members.ts` and let the next
   * fetch update this store, never by patching it directly (same
   * convention as `students.store.ts`).
   */
  setStaffMembers: (staffMembers: StaffMember[]) => void;
}

export const useStaffMembersStore = create<StaffMembersState>()((set) => ({
  staffMembers: [],
  setStaffMembers: (staffMembers) => set({ staffMembers }),
}));

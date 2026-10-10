import { create } from "zustand";
import type { ElectiveGroup } from "@/types/elective-group";

interface ElectiveGroupsState {
  electiveGroups: ElectiveGroup[];
  /** Hydrated from the real backend by `dashboard/layout.tsx` via `useElectiveGroups` — never seeded/mocked. */
  setElectiveGroups: (electiveGroups: ElectiveGroup[]) => void;
}

export const useElectiveGroupsStore = create<ElectiveGroupsState>()((set) => ({
  electiveGroups: [],
  setElectiveGroups: (electiveGroups) => set({ electiveGroups }),
}));

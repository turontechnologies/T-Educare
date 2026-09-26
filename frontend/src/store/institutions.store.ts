import { create } from "zustand";
import type { Institution } from "@/types/institution";

interface InstitutionsState {
  institutions: Institution[];
  /**
   * Called after every institutions fetch (see `super-admin/layout.tsx` and
   * `dashboard/layout.tsx`) to hydrate this store with real, server-backed
   * data — mirrors the same "fetch then setX" convention `dashboard.store.ts`
   * already uses for its own real-API-backed state. Never seeded/mocked;
   * empty until the first fetch resolves. Every Institutions field
   * (§4.1/4.3/4.4 core fields/status/archive, §4.6 modules, §4.7 license) is
   * real and server-backed now — write through the real mutation hooks in
   * `hooks/use-institutions.ts` and let the next fetch update this store,
   * never by patching it directly.
   */
  setInstitutions: (institutions: Institution[]) => void;
}

export const useInstitutionsStore = create<InstitutionsState>()((set) => ({
  institutions: [],

  setInstitutions: (institutions) => set({ institutions }),
}));

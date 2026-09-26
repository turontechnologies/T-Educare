import { create } from "zustand";
import type { Institution } from "@/types/institution";

function merge(
  real: Institution[],
  overrides: Record<string, Partial<Institution>>,
): Institution[] {
  if (Object.keys(overrides).length === 0) return real;
  return real.map((institution) =>
    overrides[institution.id]
      ? { ...institution, ...overrides[institution.id] }
      : institution,
  );
}

interface InstitutionsState {
  /** Real institutions merged with any local-only overrides below — read this. */
  institutions: Institution[];
  /** Raw server data, kept separately so a background refetch never wipes `localOverrides`. */
  realInstitutions: Institution[];
  /** Fields patched only in-memory (see `updateInstitution` below), keyed by institution id. */
  localOverrides: Record<string, Partial<Institution>>;
  /**
   * Called after every institutions fetch (see `super-admin/layout.tsx` and
   * `dashboard/layout.tsx`) to hydrate this store with real, server-backed
   * data — mirrors the same "fetch then setX" convention `dashboard.store.ts`
   * already uses for its own real-API-backed state. Never seeded/mocked
   * anymore; empty until the first fetch resolves.
   */
  setInstitutions: (institutions: Institution[]) => void;
  /**
   * Local-only patch — does NOT persist to the backend. Institutions
   * §4.1/4.3/4.4 (core fields, status, archive/restore) and §4.6 (Modules,
   * `moduleKeys`/`modulesCount`/`modulesLastEditedAt` — see
   * `useLinkModules()`) are both real now; only §4.7 (License Manager) has
   * no backend yet, so its dialog still patches `licenseType`/`licenseKey`/
   * etc. here, in-memory only, layered on top of the real data via
   * `merge()` above so a background refetch of the real list doesn't
   * silently wipe it mid-session. Never use this for a field with a real
   * endpoint — call the real mutation instead and let the next fetch update
   * `institutions`.
   */
  updateInstitution: (id: string, patch: Partial<Institution>) => void;
}

export const useInstitutionsStore = create<InstitutionsState>()((set, get) => ({
  institutions: [],
  realInstitutions: [],
  localOverrides: {},

  setInstitutions: (institutions) => {
    set({
      realInstitutions: institutions,
      institutions: merge(institutions, get().localOverrides),
    });
  },

  updateInstitution: (id, patch) => {
    const nextOverrides = {
      ...get().localOverrides,
      [id]: { ...get().localOverrides[id], ...patch },
    };
    set({
      localOverrides: nextOverrides,
      institutions: merge(get().realInstitutions, nextOverrides),
    });
  },
}));

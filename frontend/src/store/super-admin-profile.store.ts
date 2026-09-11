import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SuperAdminProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  /** Mock-only plaintext — there is no backend yet (see CLAUDE.md). Also what `authService.login` checks the "Super_Admin" login against, so a password change here takes effect on the next login. */
  password: string;
}

const SEEDED_PROFILE: SuperAdminProfile = {
  firstName: "Ada",
  lastName: "Okoye",
  email: "ada.okoye@turontech.com",
  phone: "08012345678",
  avatarUrl: undefined,
  password: "Super@2024",
};

interface SuperAdminProfileState {
  profile: SuperAdminProfile;
  updateProfile: (patch: Partial<Omit<SuperAdminProfile, "password">>) => void;
  changePassword: (newPassword: string) => void;
}

export const useSuperAdminProfileStore = create<SuperAdminProfileState>()(
  persist(
    (set) => ({
      profile: SEEDED_PROFILE,

      updateProfile: (patch) => {
        set((state) => ({ profile: { ...state.profile, ...patch } }));
      },

      changePassword: (newPassword) => {
        set((state) => ({
          profile: { ...state.profile, password: newPassword },
        }));
      },
    }),
    {
      name: "t-educare-super-admin-profile",
      version: 1,
      // Mock data standing in for a real API (see frontend/CLAUDE.md) — a
      // version bump means "discard whatever was cached and reseed".
      migrate: () => ({ profile: SEEDED_PROFILE }),
    },
  ),
);

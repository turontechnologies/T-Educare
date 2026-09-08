import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthenticatedUser } from "@/types/auth";

interface AuthState {
  user: AuthenticatedUser | null;
  /** The bearer token issued at login — attached to every API request by lib/axios.ts. */
  token: string | null;
  hasHydrated: boolean;
  setUser: (user: AuthenticatedUser | null) => void;
  setToken: (token: string | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "t-educare-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

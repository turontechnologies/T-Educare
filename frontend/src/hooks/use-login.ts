import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import type { LoginRequest } from "@/types/auth";

export function useLogin() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      // Clear any stale session before trying a fresh login so the app does not
      // accidentally send an expired bearer token on the login request itself.
      useAuthStore.getState().logout();
      return authService.login(payload);
    },
    onSuccess: ({ user, token }) => {
      setUser(user);
      setToken(token);
      toast.success(`Welcome back, ${user.firstName}`);
      router.push(user.role === "super_admin" ? "/super-admin" : "/dashboard");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Login failed");
    },
  });
}

/**
 * Re-fetches the current session's own account from the backend — every
 * field on it (name, email, phone, avatar, institution assignment/name/
 * logo) is read live from `dbo.users`/`Institution` on the server, never
 * cached (see backend AuthDirectory). `useAuthStore.user` is otherwise only
 * ever set once, at login — without this, a User Manager edit made by a
 * super admin (or an institution rename/logo change) wouldn't show up
 * anywhere driven by that store (the header, the sidebar brand) until the
 * affected user logs out and back in. Wired into `dashboard/layout.tsx` and
 * `super-admin/layout.tsx` so it runs on every app mount and on window
 * refocus (TanStack Query's default), the same way `useInstitutions` already
 * keeps the institutions store fresh.
 */
export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authService.me(),
    enabled,
    staleTime: 30_000,
  });
}

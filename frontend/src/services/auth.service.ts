import { apiClient } from "@/lib/axios";
import { useInstitutionsStore } from "@/store/institutions.store";
import { ROOT_ADMIN_ROLE_ID, useRbacStore } from "@/store/rbac.store";
import { useSuperAdminProfileStore } from "@/store/super-admin-profile.store";
import { useUserManagersStore } from "@/store/user-managers.store";
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
} from "@/types/auth";

/**
 * backend/ has no `/auth/login` yet (see backend/README.md) — this stands in
 * so the login → dashboard flow can be built and exercised end-to-end.
 *
 * - `super_admin` is the only fixed *username* — there's no "manage super
 *   admins" screen, it's the platform owner, singular — but everything else
 *   about that account (name, email, phone, avatar, password) is resolved
 *   *live* from `useSuperAdminProfileStore`, so editing it on
 *   `/super-admin/profile` changes what works at `/login` immediately.
 * - Every `institution_admin` login authenticates against the real
 *   `useUserManagersStore` records — the exact accounts shown on
 *   `/super-admin/user-manager`, including "Turon_Admin"/"Amara_Bello". So
 *   creating, editing, resetting the password of, or deactivating an
 *   account there (or the account editing itself via
 *   `/dashboard/profile`) changes what works at `/login` immediately, the
 *   same way it would against a real backend. Its Role is then resolved
 *   *live* from `useRbacStore` by matching email — no match (an account
 *   nobody has assigned a restricted Role to) falls back to unrestricted,
 *   since a provisioned admin account defaults to full access until told
 *   otherwise.
 */
export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const usernameKey = payload.username.trim().toLowerCase();

    if (usernameKey === "super_admin") {
      const { profile } = useSuperAdminProfileStore.getState();
      if (payload.password !== profile.password) {
        throw new Error("Invalid username or password.");
      }
      const user: AuthenticatedUser = {
        id: "demo-super-admin",
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        avatarUrl: profile.avatarUrl,
        role: "super_admin",
      };
      return { user, token: `demo-session-token-${user.id}` };
    }

    const account = useUserManagersStore
      .getState()
      .userManagers.find(
        (u) => !u.archivedAt && u.username.toLowerCase() === usernameKey,
      );

    if (account && account.password === payload.password) {
      if (account.status !== "active") {
        throw new Error("This account has been deactivated.");
      }

      // institutionName is a denormalized display string (see
      // institution-modules-dialog.tsx and the User Manager dialog) rather
      // than a stored FK, so this match breaks if an institution is
      // renamed after an admin account is assigned to it — an accepted
      // limitation of the mock data layer, same as elsewhere in this app.
      const institution = useInstitutionsStore
        .getState()
        .institutions.find(
          (i) => !i.archivedAt && i.name === account.institutionName,
        );

      if (!institution) {
        throw new Error("This account's institution could not be found.");
      }

      const managedUser = useRbacStore
        .getState()
        .users.find((u) => u.email === account.email);

      const user: AuthenticatedUser = {
        id: account.id,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phone: account.phone,
        avatarUrl: account.avatarUrl,
        role: "institution_admin",
        institutionId: institution.id,
        institutionName: institution.name,
        roleId: managedUser?.roleId ?? ROOT_ADMIN_ROLE_ID,
      };

      return { user, token: `demo-session-token-${user.id}` };
    }

    throw new Error("Invalid username or password.");

    // Once backend/auth/login exists, replace the block above with:
    // const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
    // return data;
  },

  async me(): Promise<AuthenticatedUser> {
    const { data } = await apiClient.get<AuthenticatedUser>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
};

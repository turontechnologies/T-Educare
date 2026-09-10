import { apiClient } from "@/lib/axios";
import { ROOT_ADMIN_ROLE_ID, useRbacStore } from "@/store/rbac.store";
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
} from "@/types/auth";

/**
 * backend/ has no `/auth/login` yet (see backend/README.md) — these hardcoded
 * demo accounts stand in so the login → dashboard flow can be built and
 * exercised end-to-end, including role-based menu access. Swap this block for
 * the real `apiClient.post` call (still below, commented) once the endpoint
 * exists.
 *
 * Demo accounts:
 *  - Super_Admin  / Super@2024   → platform super admin
 *  - Turon_Admin  / Turon@2024   → institution root admin (full access)
 *  - Amara_Bello  / Amara@2024   → restricted institution staff (Front Desk
 *    Officer role — only Dashboard/Registration/Student Management), to prove
 *    the RBAC menu filtering actually works, not just the root admin's view.
 */
const DEMO_ACCOUNTS: Record<
  string,
  { password: string; user: AuthenticatedUser }
> = {
  super_admin: {
    password: "Super@2024",
    user: {
      id: "demo-super-admin",
      firstName: "Ada",
      lastName: "Okoye",
      email: "ada.okoye@turontech.com",
      role: "super_admin",
    },
  },
  turon_admin: {
    password: "Turon@2024",
    user: {
      id: "demo-admin-1",
      firstName: "Christian",
      lastName: "Smart",
      email: "christian.smart@turontech.com",
      role: "institution_admin",
      roleId: ROOT_ADMIN_ROLE_ID,
      institutionName: "XYZ College of Technology",
    },
  },
  amara_bello: {
    password: "Amara@2024",
    user: {
      id: "user-amara-bello",
      firstName: "Amara",
      lastName: "Bello",
      email: "amara.bello@turontech.com",
      role: "institution_admin",
      roleId: "role-front-desk",
      institutionName: "XYZ College of Technology",
    },
  },
};

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const account = DEMO_ACCOUNTS[payload.username.trim().toLowerCase()];

    if (account && payload.password === account.password) {
      // Resolve the *current* role assignment from the RBAC store rather than
      // the static seed, so edits made in User Management take effect on the
      // next login.
      const managedUser = useRbacStore
        .getState()
        .users.find((u) => u.email === account.user.email);

      const user: AuthenticatedUser =
        managedUser && account.user.role === "institution_admin"
          ? { ...account.user, roleId: managedUser.roleId }
          : account.user;

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

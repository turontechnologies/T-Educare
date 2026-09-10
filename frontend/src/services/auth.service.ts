import { apiClient } from "@/lib/axios";
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
} from "@/types/auth";

/**
 * backend/ has no `/auth/login` yet (see backend/README.md) — this hardcoded
 * demo account stands in so the login → dashboard flow can be built and
 * exercised end-to-end. Swap this block for the real `apiClient.post` call
 * (still below, commented) once the endpoint exists.
 */
const DEMO_CREDENTIALS = {
  username: "Turon_Admin",
  password: "Turon@2024",
};

const DEMO_USER: AuthenticatedUser = {
  id: "demo-admin-1",
  firstName: "Christian",
  lastName: "Smart",
  email: "christian.smart@turontech.com",
  role: "admin",
};

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const matchesDemoAccount =
      payload.username.trim().toLowerCase() ===
        DEMO_CREDENTIALS.username.toLowerCase() &&
      payload.password === DEMO_CREDENTIALS.password;

    if (matchesDemoAccount) {
      return { user: DEMO_USER, token: "demo-session-token" };
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

import { apiClient } from "@/lib/axios";
import type {
  AuthenticatedUser,
  LoginRequest,
  LoginResponse,
} from "@/types/auth";

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },

  async me(): Promise<AuthenticatedUser> {
    const { data } = await apiClient.get<AuthenticatedUser>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Session is still being cleared client-side even if the backend endpoint
      // is unavailable; we do not block the user from leaving the app.
    }
  },
};

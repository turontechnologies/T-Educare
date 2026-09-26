import { apiClient } from "@/lib/axios";
import type { AuthenticatedUser } from "@/types/auth";

export type ProfileSummary = {
  institutionsCount?: number;
  licensed?: number;
  linkedModules?: number;
  userManagerAccounts?: number;
  /** institution_admin only. */
  institutionName?: string;
  roleId?: string;
  menuKeysCount?: number;
  institutionStatus?: string;
  [key: string]: unknown;
};

export type ProfileResponse = {
  profile: AuthenticatedUser & {
    phone?: string;
    avatarUrl?: string;
    menuKeys?: string[];
  };
  summary: ProfileSummary;
};

export type ProfileUpdatePayload = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
}>;

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    const { data } = await apiClient.get<ProfileResponse>("/profile");
    return data;
  },

  async updateProfile(payload: ProfileUpdatePayload): Promise<ProfileResponse> {
    const { data } = await apiClient.patch<ProfileResponse>(
      "/profile",
      payload,
    );
    return data;
  },

  async updatePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.patch("/profile/password", payload);
  },
};

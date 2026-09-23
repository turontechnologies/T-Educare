import { apiClient } from "@/lib/axios";
import type { AuthenticatedUser } from "@/types/auth";

export type ProfileSummary = {
  institutionsCount?: number;
  licensed?: number;
  linkedModules?: number;
  userManagerAccounts?: number;
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

export const profileService = {
  async getProfile(): Promise<ProfileResponse> {
    const { data } = await apiClient.get<ProfileResponse>("/profile");
    return data;
  },

  async updatePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await apiClient.patch("/profile/password", payload);
  },
};

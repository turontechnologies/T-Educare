import { apiClient } from "@/lib/axios";
import type { StudentIdentitySettings } from "@/types/student";

export const studentIdentitySettingsService = {
  async get(): Promise<StudentIdentitySettings> {
    const { data } = await apiClient.get<StudentIdentitySettings>(
      "/student-identity-settings",
    );
    return data;
  },

  async update(
    payload: StudentIdentitySettings,
  ): Promise<StudentIdentitySettings> {
    const { data } = await apiClient.put<StudentIdentitySettings>(
      "/student-identity-settings",
      payload,
    );
    return data;
  },
};

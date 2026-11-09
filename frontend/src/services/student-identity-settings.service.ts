import { apiClient } from "@/lib/axios";
import type {
  StudentIdentitySettings,
  UpdateStudentIdentitySettingsPayload,
} from "@/types/student";

export const studentIdentitySettingsService = {
  async get(): Promise<StudentIdentitySettings> {
    const { data } = await apiClient.get<StudentIdentitySettings>(
      "/student-identity-settings",
    );
    return data;
  },

  async update(
    payload: UpdateStudentIdentitySettingsPayload,
  ): Promise<StudentIdentitySettings> {
    const { data } = await apiClient.put<StudentIdentitySettings>(
      "/student-identity-settings",
      payload,
    );
    return data;
  },
};

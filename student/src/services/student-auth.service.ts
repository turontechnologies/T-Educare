import { apiClient } from "@/lib/axios";
import type {
  InstitutionBranding,
  StudentAuthProfile,
  StudentLoginRequest,
  StudentLoginResponse,
} from "@/types/student-auth";

export const studentAuthService = {
  async login(payload: StudentLoginRequest): Promise<StudentLoginResponse> {
    const { data } = await apiClient.post<StudentLoginResponse>(
      "/student-auth/login",
      payload,
    );
    return data;
  },

  async me(): Promise<StudentAuthProfile> {
    const { data } =
      await apiClient.get<StudentAuthProfile>("/student-auth/me");
    return data;
  },

  async brandingBySlug(slug: string): Promise<InstitutionBranding> {
    const { data } = await apiClient.get<InstitutionBranding>(
      `/public/institutions/by-slug/${encodeURIComponent(slug)}`,
    );
    return data;
  },
};

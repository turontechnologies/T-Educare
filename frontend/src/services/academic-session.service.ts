import { apiClient } from "@/lib/axios";
import type { AcademicSession } from "@/types/academics";

export type AcademicSessionFormPayload = {
  session: string;
  from: string;
  to: string;
  status?: string;
};

export const academicSessionService = {
  async list(includeArchived = false): Promise<AcademicSession[]> {
    const { data } = await apiClient.get<AcademicSession[]>(
      "/academic-sessions",
      {
        params: { includeArchived },
      },
    );
    return data;
  },

  async create(payload: AcademicSessionFormPayload): Promise<AcademicSession> {
    const { data } = await apiClient.post<AcademicSession>(
      "/academic-sessions",
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: Partial<AcademicSessionFormPayload>,
  ): Promise<AcademicSession> {
    const { data } = await apiClient.patch<AcademicSession>(
      `/academic-sessions/${id}`,
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<AcademicSession> {
    const { data } = await apiClient.post<AcademicSession>(
      `/academic-sessions/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<AcademicSession> {
    const { data } = await apiClient.post<AcademicSession>(
      `/academic-sessions/${id}/restore`,
    );
    return data;
  },

  async setCurrent(id: string): Promise<AcademicSession> {
    const { data } = await apiClient.post<AcademicSession>(
      `/academic-sessions/${id}/set-current`,
    );
    return data;
  },

  async close(id: string): Promise<AcademicSession> {
    const { data } = await apiClient.post<AcademicSession>(
      `/academic-sessions/${id}/close`,
    );
    return data;
  },
};

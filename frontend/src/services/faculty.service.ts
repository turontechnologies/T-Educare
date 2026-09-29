import { apiClient } from "@/lib/axios";
import type { Faculty } from "@/types/faculty";

export type FacultyFormPayload = {
  name: string;
  deanName: string;
  schoolId: string;
};

export const facultyService = {
  async list(includeArchived = false, schoolId?: string): Promise<Faculty[]> {
    const { data } = await apiClient.get<Faculty[]>("/faculties", {
      params: { includeArchived, schoolId },
    });
    return data;
  },

  async create(payload: FacultyFormPayload): Promise<Faculty> {
    const { data } = await apiClient.post<Faculty>("/faculties", payload);
    return data;
  },

  async update(
    id: string,
    payload: Partial<FacultyFormPayload>,
  ): Promise<Faculty> {
    const { data } = await apiClient.patch<Faculty>(
      `/faculties/${id}`,
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<Faculty> {
    const { data } = await apiClient.post<Faculty>(`/faculties/${id}/archive`);
    return data;
  },

  async restore(id: string): Promise<Faculty> {
    const { data } = await apiClient.post<Faculty>(`/faculties/${id}/restore`);
    return data;
  },
};

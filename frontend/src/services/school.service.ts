import { apiClient } from "@/lib/axios";
import type { School } from "@/types/school";

export type SchoolFormPayload = {
  name: string;
  headName: string;
  designation: string;
};

export const schoolService = {
  async list(includeArchived = false): Promise<School[]> {
    const { data } = await apiClient.get<School[]>("/schools", {
      params: { includeArchived },
    });
    return data;
  },

  async create(payload: SchoolFormPayload): Promise<School> {
    const { data } = await apiClient.post<School>("/schools", payload);
    return data;
  },

  async update(
    id: string,
    payload: Partial<SchoolFormPayload>,
  ): Promise<School> {
    const { data } = await apiClient.patch<School>(`/schools/${id}`, payload);
    return data;
  },

  async archive(id: string): Promise<School> {
    const { data } = await apiClient.post<School>(`/schools/${id}/archive`);
    return data;
  },

  async restore(id: string): Promise<School> {
    const { data } = await apiClient.post<School>(`/schools/${id}/restore`);
    return data;
  },
};

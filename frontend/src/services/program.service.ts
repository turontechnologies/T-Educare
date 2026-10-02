import { apiClient } from "@/lib/axios";
import type { Program, ProgramType } from "@/types/program";

export type ProgramFormPayload = {
  name: string;
  departmentId: string;
  facultyId: string;
  programType: ProgramType;
};

export const programService = {
  async list(
    includeArchived = false,
    departmentId?: string,
    facultyId?: string,
  ): Promise<Program[]> {
    const { data } = await apiClient.get<Program[]>("/programs", {
      params: { includeArchived, departmentId, facultyId },
    });
    return data;
  },

  async create(payload: ProgramFormPayload): Promise<Program> {
    const { data } = await apiClient.post<Program>("/programs", payload);
    return data;
  },

  async update(
    id: string,
    payload: Partial<ProgramFormPayload>,
  ): Promise<Program> {
    const { data } = await apiClient.patch<Program>(`/programs/${id}`, payload);
    return data;
  },

  async archive(id: string): Promise<Program> {
    const { data } = await apiClient.post<Program>(`/programs/${id}/archive`);
    return data;
  },

  async restore(id: string): Promise<Program> {
    const { data } = await apiClient.post<Program>(`/programs/${id}/restore`);
    return data;
  },
};

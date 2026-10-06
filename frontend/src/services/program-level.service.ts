import { apiClient } from "@/lib/axios";
import type { ProgramLevel } from "@/types/program-level";

export type ProgramLevelFormPayload = {
  levelCode: string;
  description: string;
};

export const programLevelService = {
  async list(includeArchived = false): Promise<ProgramLevel[]> {
    const { data } = await apiClient.get<ProgramLevel[]>("/program-levels", {
      params: { includeArchived },
    });
    return data;
  },

  async create(payload: ProgramLevelFormPayload): Promise<ProgramLevel> {
    const { data } = await apiClient.post<ProgramLevel>(
      "/program-levels",
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: Partial<ProgramLevelFormPayload>,
  ): Promise<ProgramLevel> {
    const { data } = await apiClient.patch<ProgramLevel>(
      `/program-levels/${id}`,
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<ProgramLevel> {
    const { data } = await apiClient.post<ProgramLevel>(
      `/program-levels/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<ProgramLevel> {
    const { data } = await apiClient.post<ProgramLevel>(
      `/program-levels/${id}/restore`,
    );
    return data;
  },
};

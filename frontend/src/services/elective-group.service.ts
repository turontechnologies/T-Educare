import { apiClient } from "@/lib/axios";
import type { ElectiveGroup } from "@/types/elective-group";

export type ElectiveGroupFormPayload = {
  departmentId: string;
  programLevelId: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  courseIds: string[];
};

export const electiveGroupService = {
  async list(includeArchived = false): Promise<ElectiveGroup[]> {
    const { data } = await apiClient.get<ElectiveGroup[]>("/elective-groups", {
      params: { includeArchived },
    });
    return data;
  },

  async create(payload: ElectiveGroupFormPayload): Promise<ElectiveGroup> {
    const { data } = await apiClient.post<ElectiveGroup>(
      "/elective-groups",
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: Partial<ElectiveGroupFormPayload>,
  ): Promise<ElectiveGroup> {
    const { data } = await apiClient.patch<ElectiveGroup>(
      `/elective-groups/${id}`,
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<ElectiveGroup> {
    const { data } = await apiClient.post<ElectiveGroup>(
      `/elective-groups/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<ElectiveGroup> {
    const { data } = await apiClient.post<ElectiveGroup>(
      `/elective-groups/${id}/restore`,
    );
    return data;
  },
};

import { apiClient } from "@/lib/axios";
import type {
  StaffCategory,
  StaffDesignation,
} from "@/types/staff-designation";

export type StaffDesignationFormPayload = {
  name: string;
  description?: string;
  category: StaffCategory;
};

export const staffDesignationService = {
  async list(includeArchived = false): Promise<StaffDesignation[]> {
    const { data } = await apiClient.get<StaffDesignation[]>(
      "/staff-designations",
      { params: { includeArchived } },
    );
    return data;
  },

  async create(
    payload: StaffDesignationFormPayload,
  ): Promise<StaffDesignation> {
    const { data } = await apiClient.post<StaffDesignation>(
      "/staff-designations",
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: Partial<StaffDesignationFormPayload>,
  ): Promise<StaffDesignation> {
    const { data } = await apiClient.patch<StaffDesignation>(
      `/staff-designations/${id}`,
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<StaffDesignation> {
    const { data } = await apiClient.post<StaffDesignation>(
      `/staff-designations/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<StaffDesignation> {
    const { data } = await apiClient.post<StaffDesignation>(
      `/staff-designations/${id}/restore`,
    );
    return data;
  },
};

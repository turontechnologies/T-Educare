import { apiClient } from "@/lib/axios";
import type { Department } from "@/types/department";

export type DepartmentFormPayload = {
  name: string;
  hodName: string;
  facultyId: string;
  schoolId: string;
};

export const departmentService = {
  async list(
    includeArchived = false,
    facultyId?: string,
    schoolId?: string,
  ): Promise<Department[]> {
    const { data } = await apiClient.get<Department[]>("/departments", {
      params: { includeArchived, facultyId, schoolId },
    });
    return data;
  },

  async create(payload: DepartmentFormPayload): Promise<Department> {
    const { data } = await apiClient.post<Department>("/departments", payload);
    return data;
  },

  async update(
    id: string,
    payload: Partial<DepartmentFormPayload>,
  ): Promise<Department> {
    const { data } = await apiClient.patch<Department>(
      `/departments/${id}`,
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<Department> {
    const { data } = await apiClient.post<Department>(
      `/departments/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<Department> {
    const { data } = await apiClient.post<Department>(
      `/departments/${id}/restore`,
    );
    return data;
  },
};

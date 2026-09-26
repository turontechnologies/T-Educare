import { apiClient } from "@/lib/axios";
import type { Role } from "@/types/role";

export type RoleFormPayload = {
  name: string;
  description?: string;
  menuKeys: string[];
};

/** Always "my own institution's roles" — scoped server-side from the caller, never an institutionId passed here (API_CONTRACT.md §5). */
export const roleService = {
  async list(): Promise<Role[]> {
    const { data } = await apiClient.get<Role[]>("/roles");
    return data;
  },

  async create(payload: RoleFormPayload): Promise<Role> {
    const { data } = await apiClient.post<Role>("/roles", payload);
    return data;
  },

  async update(id: string, payload: Partial<RoleFormPayload>): Promise<Role> {
    const { data } = await apiClient.patch<Role>(`/roles/${id}`, payload);
    return data;
  },

  async archive(id: string): Promise<Role> {
    const { data } = await apiClient.post<Role>(`/roles/${id}/archive`);
    return data;
  },

  async restore(id: string): Promise<Role> {
    const { data } = await apiClient.post<Role>(`/roles/${id}/restore`);
    return data;
  },
};

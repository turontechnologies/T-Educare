import { apiClient } from "@/lib/axios";
import type { Role } from "@/types/role";

export type RoleFormPayload = {
  name: string;
  description?: string;
  menuKeys: string[];
};

export const roleService = {
  /**
   * For an institution_admin caller, always "my own institution's roles" —
   * scoped server-side, `institutionId` is ignored/not needed. A
   * super_admin caller has no institution of their own, so must pass one
   * explicitly to *view* that institution's real roles (e.g. to populate a
   * role picker in the super admin's own User Manager dialog) — mutating a
   * role stays institution_admin self-service only either way
   * (API_CONTRACT.md §5).
   */
  async list(institutionId?: string): Promise<Role[]> {
    const { data } = await apiClient.get<Role[]>("/roles", {
      params: institutionId ? { institutionId } : undefined,
    });
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

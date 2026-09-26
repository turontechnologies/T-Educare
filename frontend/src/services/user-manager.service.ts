import { apiClient } from "@/lib/axios";
import type {
  UserManagerAccount,
  UserManagerStatus,
} from "@/types/user-manager";

export type UserManagersListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  includeArchived?: boolean;
};

export type UserManagersListResponse = {
  data: UserManagerAccount[];
  meta: { page: number; perPage: number; total: number };
};

export type UserManagerFormPayload = {
  firstName: string;
  otherName?: string;
  lastName: string;
  gender?: string;
  email: string;
  phone?: string;
  username: string;
  /** Required on create; the backend has no password field on edit — use resetPassword instead. */
  password?: string;
  institutionId: string;
  isPrimaryAdmin: boolean;
  avatarUrl?: string;
  /** Omit to leave unchanged; "" clears back to unrestricted; otherwise a real Role.id (see hooks/use-roles.ts). */
  roleId?: string;
};

export const userManagerService = {
  async list(
    params: UserManagersListParams = {},
  ): Promise<UserManagersListResponse> {
    const { data } = await apiClient.get<UserManagersListResponse>(
      "/user-managers",
      {
        params: {
          page: params.page,
          perPage: params.perPage,
          search: params.search || undefined,
          includeArchived: params.includeArchived,
        },
      },
    );
    return data;
  },

  async create(payload: UserManagerFormPayload): Promise<UserManagerAccount> {
    const { data } = await apiClient.post<UserManagerAccount>(
      "/user-managers",
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: Partial<UserManagerFormPayload>,
  ): Promise<UserManagerAccount> {
    const { data } = await apiClient.patch<UserManagerAccount>(
      `/user-managers/${id}`,
      payload,
    );
    return data;
  },

  async updateStatus(
    id: string,
    status: UserManagerStatus,
  ): Promise<UserManagerAccount> {
    const { data } = await apiClient.patch<UserManagerAccount>(
      `/user-managers/${id}/status`,
      { status },
    );
    return data;
  },

  async archive(id: string): Promise<UserManagerAccount> {
    const { data } = await apiClient.post<UserManagerAccount>(
      `/user-managers/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<UserManagerAccount> {
    const { data } = await apiClient.post<UserManagerAccount>(
      `/user-managers/${id}/restore`,
    );
    return data;
  },

  async resetPassword(id: string): Promise<{ password: string }> {
    const { data } = await apiClient.post<{ password: string }>(
      `/user-managers/${id}/reset-password`,
    );
    return data;
  },
};

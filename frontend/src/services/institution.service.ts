import { apiClient } from "@/lib/axios";
import type { Institution, InstitutionStatus } from "@/types/institution";

export type InstitutionsListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  includeArchived?: boolean;
  /** Only institutions with no modules linked yet (API_CONTRACT.md §4.6.2) — for the "Link New Institution" picker. */
  unlinkedOnly?: boolean;
};

export type InstitutionsListResponse = {
  data: Institution[];
  meta: { page: number; perPage: number; total: number };
};

export type InstitutionFormPayload = {
  name: string;
  institutionType: string;
  address?: string;
  city?: string;
  countryState?: string;
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
  adminUser?: string;
  adminEmail?: string;
  logoUrl?: string;
};

export const institutionService = {
  async list(
    params: InstitutionsListParams = {},
  ): Promise<InstitutionsListResponse> {
    const { data } = await apiClient.get<InstitutionsListResponse>(
      "/institutions",
      {
        params: {
          page: params.page,
          perPage: params.perPage,
          search: params.search || undefined,
          includeArchived: params.includeArchived,
          unlinkedOnly: params.unlinkedOnly,
        },
      },
    );
    return data;
  },

  async create(payload: InstitutionFormPayload): Promise<Institution> {
    const { data } = await apiClient.post<Institution>(
      "/institutions",
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: Partial<InstitutionFormPayload>,
  ): Promise<Institution> {
    const { data } = await apiClient.patch<Institution>(
      `/institutions/${id}`,
      payload,
    );
    return data;
  },

  async updateStatus(
    id: string,
    status: InstitutionStatus,
  ): Promise<Institution> {
    const { data } = await apiClient.patch<Institution>(
      `/institutions/${id}/status`,
      { status },
    );
    return data;
  },

  async archive(id: string): Promise<Institution> {
    const { data } = await apiClient.post<Institution>(
      `/institutions/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<Institution> {
    const { data } = await apiClient.post<Institution>(
      `/institutions/${id}/restore`,
    );
    return data;
  },

  /** A full replace, not an additive merge — whatever `moduleKeys` is sent becomes the institution's entire module set (API_CONTRACT.md §4.6.2). Also activates the institution server-side. */
  async linkModules(id: string, moduleKeys: string[]): Promise<Institution> {
    const { data } = await apiClient.patch<Institution>(
      `/institutions/${id}/modules`,
      { moduleKeys },
    );
    return data;
  },
};

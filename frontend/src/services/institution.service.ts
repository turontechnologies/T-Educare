import { apiClient } from "@/lib/axios";
import type {
  Institution,
  InstitutionStatus,
  LicenseType,
} from "@/types/institution";

export type InstitutionsListParams = {
  page?: number;
  perPage?: number;
  search?: string;
  includeArchived?: boolean;
  /** Only institutions with no modules linked yet (API_CONTRACT.md §4.6.2) — for the "Link New Institution" picker. */
  unlinkedOnly?: boolean;
  /** Only institutions with no license issued yet (API_CONTRACT.md §4.7.1) — for the "Select Institution" picker on "Create New License". */
  unlicensedOnly?: boolean;
};

export type LicensePayload = {
  licenseType: LicenseType;
  /** Required unless licenseType is "Basic" — the backend forces it to null for Basic regardless of what's sent here. */
  expiringAt?: string;
  licenseKey: string;
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
          unlicensedOnly: params.unlicensedOnly,
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

  /** Sets licenseType/expiringAt/licenseKey; the backend forces expiringAt to null for "Basic" and sets licenseIssuedAt only the first time (immutable afterward) — API_CONTRACT.md §4.7.1. */
  async saveLicense(id: string, payload: LicensePayload): Promise<Institution> {
    const { data } = await apiClient.patch<Institution>(
      `/institutions/${id}/license`,
      payload,
    );
    return data;
  },

  async regenerateLicenseKey(id: string): Promise<{ licenseKey: string }> {
    const { data } = await apiClient.post<{ licenseKey: string }>(
      `/institutions/${id}/regenerate-license-key`,
    );
    return data;
  },

  async revokeLicense(id: string): Promise<Institution> {
    const { data } = await apiClient.post<Institution>(
      `/institutions/${id}/revoke-license`,
    );
    return data;
  },
};

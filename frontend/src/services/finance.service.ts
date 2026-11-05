import { apiClient } from "@/lib/axios";
import type { FeeType, LatePenaltyType } from "@/types/finance";

export type FeeTypePayload = {
  name: string;
  departmentId?: string;
  programLevelId?: string;
  academicSessionId: string;
  amount: number;
  dueDate: string;
  latePenaltyType: LatePenaltyType;
  latePenaltyValue?: number | null;
};

export const financeService = {
  async listFeeTypes(): Promise<FeeType[]> {
    const { data } = await apiClient.get<FeeType[]>("/financials/fee-types");
    return data;
  },

  async createFeeType(payload: FeeTypePayload): Promise<FeeType> {
    const { data } = await apiClient.post<FeeType>(
      "/financials/fee-types",
      payload,
    );
    return data;
  },

  async updateFeeType(id: string, payload: FeeTypePayload): Promise<FeeType> {
    const { data } = await apiClient.put<FeeType>(
      `/financials/fee-types/${id}`,
      payload,
    );
    return data;
  },

  async archiveFeeType(id: string): Promise<void> {
    await apiClient.delete(`/financials/fee-types/${id}`);
  },
};

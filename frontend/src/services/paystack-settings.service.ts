import { apiClient } from "@/lib/axios";
import type { PaystackSettings } from "@/types/finance";

export type PaystackSettingsPayload = {
  publicKey: string;
  secretKey: string;
  enabled: boolean;
};

export const paystackSettingsService = {
  async get(institutionId: string): Promise<PaystackSettings> {
    const { data } = await apiClient.get<PaystackSettings>(
      `/super-admin/institutions/${institutionId}/paystack-settings`,
    );
    return data;
  },

  async update(
    institutionId: string,
    payload: PaystackSettingsPayload,
  ): Promise<PaystackSettings> {
    const { data } = await apiClient.put<PaystackSettings>(
      `/super-admin/institutions/${institutionId}/paystack-settings`,
      payload,
    );
    return data;
  },
};

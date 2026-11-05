import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  paystackSettingsService,
  type PaystackSettingsPayload,
} from "@/services/paystack-settings.service";

const KEY = "paystack-settings";

export function usePaystackSettings(
  institutionId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [KEY, institutionId],
    queryFn: () => paystackSettingsService.get(institutionId!),
    enabled: (options.enabled ?? true) && !!institutionId,
  });
}

export function useUpdatePaystackSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      institutionId,
      payload,
    }: {
      institutionId: string;
      payload: PaystackSettingsPayload;
    }) => paystackSettingsService.update(institutionId, payload),
    onSuccess: (_, { institutionId }) =>
      queryClient.invalidateQueries({ queryKey: [KEY, institutionId] }),
  });
}

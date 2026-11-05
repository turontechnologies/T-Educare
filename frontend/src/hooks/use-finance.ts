import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  financeService,
  type FeeTypePayload,
} from "@/services/finance.service";

const FEE_TYPES_KEY = "finance-fee-types";

export function useFeeTypes() {
  return useQuery({
    queryKey: [FEE_TYPES_KEY],
    queryFn: () => financeService.listFeeTypes(),
  });
}

function useInvalidateFeeTypes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [FEE_TYPES_KEY] });
}

export function useCreateFeeType() {
  const invalidate = useInvalidateFeeTypes();
  return useMutation({
    mutationFn: (payload: FeeTypePayload) =>
      financeService.createFeeType(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateFeeType() {
  const invalidate = useInvalidateFeeTypes();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FeeTypePayload }) =>
      financeService.updateFeeType(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveFeeType() {
  const invalidate = useInvalidateFeeTypes();
  return useMutation({
    mutationFn: (id: string) => financeService.archiveFeeType(id),
    onSuccess: invalidate,
  });
}

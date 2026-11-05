import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  financeService,
  type FeeTypePayload,
  type PaystackLinkPayload,
  type RecordPaymentPayload,
} from "@/services/finance.service";

const FEE_TYPES_KEY = "finance-fee-types";
const STUDENT_BILLS_KEY = "finance-student-bills";
const LEDGER_KEY = "finance-ledger";
const TRANSACTION_LOG_KEY = "finance-transaction-log";

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

export function useStudentBills(academicSessionId?: string) {
  return useQuery({
    queryKey: [STUDENT_BILLS_KEY, academicSessionId ?? "all"],
    queryFn: () => financeService.listStudentBills(academicSessionId),
  });
}

export function useLedger(
  studentId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [LEDGER_KEY, studentId],
    queryFn: () => financeService.ledger(studentId!),
    enabled: (options.enabled ?? true) && !!studentId,
  });
}

function useInvalidateBills() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [STUDENT_BILLS_KEY] });
    queryClient.invalidateQueries({ queryKey: [LEDGER_KEY] });
    queryClient.invalidateQueries({ queryKey: [TRANSACTION_LOG_KEY] });
  };
}

export function useRecordPayment() {
  const invalidate = useInvalidateBills();
  return useMutation({
    mutationFn: ({
      studentId,
      payload,
    }: {
      studentId: string;
      payload: RecordPaymentPayload;
    }) => financeService.recordPayment(studentId, payload),
    onSuccess: invalidate,
  });
}

export function useInitiatePaystackPayment() {
  return useMutation({
    mutationFn: ({
      studentId,
      payload,
    }: {
      studentId: string;
      payload: PaystackLinkPayload;
    }) => financeService.initiatePaystackPayment(studentId, payload),
  });
}

export function useTransactionLog() {
  return useQuery({
    queryKey: [TRANSACTION_LOG_KEY],
    queryFn: () => financeService.listTransactionLog(),
  });
}

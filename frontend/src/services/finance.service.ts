import { apiClient } from "@/lib/axios";
import type {
  FeeType,
  FinanceTransactionLogEntry,
  LatePenaltyType,
  LedgerLine,
  PaymentMethod,
  StudentBillSummary,
} from "@/types/finance";

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

export type RecordPaymentPayload = {
  billLineId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paymentDate: string;
  proofUrl?: string;
};

export type PaystackLinkPayload = {
  amount: number;
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

  async listStudentBills(
    academicSessionId?: string,
  ): Promise<StudentBillSummary[]> {
    const { data } = await apiClient.get<StudentBillSummary[]>(
      "/financials/student-bills",
      { params: academicSessionId ? { academicSessionId } : undefined },
    );
    return data;
  },

  async ledger(studentId: string): Promise<LedgerLine[]> {
    const { data } = await apiClient.get<LedgerLine[]>(
      `/financials/student-bills/${studentId}/ledger`,
    );
    return data;
  },

  async recordPayment(
    studentId: string,
    payload: RecordPaymentPayload,
  ): Promise<void> {
    await apiClient.post(
      `/financials/student-bills/${studentId}/payments`,
      payload,
    );
  },

  async initiatePaystackPayment(
    studentId: string,
    payload: PaystackLinkPayload,
  ): Promise<{ authorizationUrl: string; reference: string }> {
    const { data } = await apiClient.post(
      `/financials/student-bills/${studentId}/paystack-link`,
      payload,
    );
    return data;
  },

  async listTransactionLog(): Promise<FinanceTransactionLogEntry[]> {
    const { data } = await apiClient.get<FinanceTransactionLogEntry[]>(
      "/financials/transaction-log",
    );
    return data;
  },
};

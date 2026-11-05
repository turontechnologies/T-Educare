export type LatePenaltyType = "NONE" | "FLAT" | "PERCENTAGE";

export type BillStatus = "OWING" | "PAID";

export interface StudentBillSummary {
  studentId: string;
  matricNo: string;
  studentName: string;
  departmentName: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  status: BillStatus;
}

export type LedgerLineType = "CHARGE" | "PENALTY";

export interface LedgerLine {
  id: string;
  date: string;
  description: string;
  reference: string;
  charge: number;
  payment: number | null;
  runningBalance: number;
  lineBalance: number;
  lineType: LedgerLineType;
}

export type PaymentMethod = "BANK_TRANSFER" | "CASH" | "POS" | "CHEQUE";

export interface FinanceTransactionLogEntry {
  id: string;
  eventType:
    | "PAYMENT_RECORDED"
    | "GATEWAY_PAYMENT_RECEIVED"
    | "PAYMENT_ALLOCATED"
    | "PAYROLL_RUN";
  studentMatricNo: string | null;
  studentName: string | null;
  amount: number | null;
  reference: string | null;
  details: string;
  recordedByName: string;
  createdAt: string;
}

export interface FeeType {
  id: string;
  code: string;
  name: string;
  departmentId: string | null;
  departmentName: string | null;
  programLevelId: string | null;
  levelCode: string | null;
  academicSessionId: string;
  sessionLabel: string;
  amount: number;
  dueDate: string;
  latePenaltyType: LatePenaltyType;
  latePenaltyValue: number | null;
  studentsBilled: number;
  createdAt: string;
}

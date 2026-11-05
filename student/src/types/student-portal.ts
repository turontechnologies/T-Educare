export interface RegisteredCourse {
  courseId: string;
  code: string;
  name: string;
  unit: number;
  isCarryover: boolean;
}

export interface AcademicSummary {
  /** null (not zero) means no scored results yet. */
  cgpa: number | null;
  currentSemesterId: string | null;
  currentSemesterName: string | null;
  registeredCourses: RegisteredCourse[];
  registeredUnits: number;
}

export interface HostelStatus {
  hostelName: string | null;
  roomNumber: string | null;
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

export type BillStatus = "OWING" | "PAID";

export interface StudentBills {
  totalBilled: number;
  totalPaid: number;
  balance: number;
  status: BillStatus;
  paystackEnabled: boolean;
  ledger: LedgerLine[];
}

export interface PaystackLinkResponse {
  authorizationUrl: string;
  reference: string;
}

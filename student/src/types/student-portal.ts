export interface RegisteredCourse {
  courseId: string;
  code: string;
  name: string;
  unit: number;
  isCarryover: boolean;
}

/** One semester's result card — {@code cumulativeCgpa} is the running CGPA as of (and including) this semester, in chronological order, not the student's final/current CGPA. {@code isProvisional}/{@code resultsStillToCome} are only meaningful for the institution's current semester. */
export interface SemesterResultSummary {
  semesterId: string;
  semesterName: string;
  sessionLabel: string;
  /** null means no scored results yet for this semester. */
  gpa: number | null;
  isProvisional: boolean;
  courseCount: number;
  totalUnits: number;
  cumulativeCgpa: number | null;
  resultsStillToCome: number | null;
}

export interface AcademicSummary {
  departmentName: string;
  levelCode: string;
  sessionLabel: string;
  /** null (not zero) means no scored results yet. */
  cgpa: number | null;
  /** Standard 5.0-scale classification band (e.g. "Second Class Upper") — null when cgpa is null. */
  cgpaClassification: string | null;
  currentSemesterId: string | null;
  currentSemesterName: string | null;
  registeredCourses: RegisteredCourse[];
  registeredUnits: number;
  resultsBySemester: SemesterResultSummary[];
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

export type LatePenaltyType = "NONE" | "FLAT" | "PERCENTAGE";

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

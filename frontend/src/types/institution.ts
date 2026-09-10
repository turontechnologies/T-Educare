export type InstitutionStatus = "active" | "inactive";

export interface Institution {
  id: string;
  name: string;
  modulesCount: number;
  studentCount: number;
  revenue: number;
  status: InstitutionStatus;
  createdAt: string;
}

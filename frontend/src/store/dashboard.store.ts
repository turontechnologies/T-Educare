export interface DashboardStats {
  registeredStudents: number;
  applicants: number;
  lecturers: number;
  accumulatedProfit: number;
}

export type EnrollmentRange = "day" | "week" | "month";
export interface EnrollmentPoint {
  label: string;
  value: number;
}

export interface RecentStudent {
  id: string;
  name: string;
  registeredAt: string;
}

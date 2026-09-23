import { apiClient } from "@/lib/axios";

export type SuperAdminStats = {
  institutionsCount: number;
  totalStudents: number;
  totalRevenue: number;
};

export type DashboardStats = {
  registeredStudents: number;
  applicants: number;
  lecturers: number;
  accumulatedProfit: number;
};

export type EnrollmentPoint = {
  label: string;
  value: number;
};

export type RecentStudent = {
  id: string;
  name: string;
  registeredAt: string;
};

export const dashboardService = {
  async getSuperAdminStats(): Promise<SuperAdminStats> {
    const { data } = await apiClient.get<SuperAdminStats>("/super-admin/stats");
    return data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<DashboardStats>("/dashboard/stats");
    return data;
  },

  async getEnrollment(range: "day" | "week" | "month" = "day") {
    const { data } = await apiClient.get<{ data: EnrollmentPoint[] }>(
      "/dashboard/enrollment",
      { params: { range } },
    );
    return data.data;
  },

  async getRecentStudents(limit = 4): Promise<RecentStudent[]> {
    const { data } = await apiClient.get<{ data: RecentStudent[] }>(
      "/dashboard/recent-students",
      { params: { limit } },
    );
    return data.data;
  },
};

import { useQuery } from "@tanstack/react-query";
import {
  dashboardService,
  type EnrollmentPoint,
  type RecentStudent,
  type SuperAdminStats,
  type DashboardStats,
} from "@/services/dashboard.service";

export function useSuperAdminDashboardStats() {
  return useQuery({
    queryKey: ["super-admin-stats"],
    queryFn: () => dashboardService.getSuperAdminStats(),
  });
}

export function useInstitutionDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardService.getDashboardStats(),
  });
}

export function useDashboardEnrollment(
  range: "day" | "week" | "month" = "day",
) {
  return useQuery<EnrollmentPoint[]>({
    queryKey: ["dashboard-enrollment", range],
    queryFn: () => dashboardService.getEnrollment(range),
  });
}

export function useRecentStudents(limit = 4) {
  return useQuery<RecentStudent[]>({
    queryKey: ["dashboard-recent-students", limit],
    queryFn: () => dashboardService.getRecentStudents(limit),
  });
}

export type { SuperAdminStats, DashboardStats, EnrollmentPoint, RecentStudent };

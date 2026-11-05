import { useMutation, useQuery } from "@tanstack/react-query";
import { studentPortalService } from "@/services/student-portal.service";

export function useAcademicSummary(enabled: boolean) {
  return useQuery({
    queryKey: ["student-portal", "academic-summary"],
    queryFn: () => studentPortalService.academicSummary(),
    enabled,
  });
}

export function useHostelStatus(enabled: boolean) {
  return useQuery({
    queryKey: ["student-portal", "hostel-status"],
    queryFn: () => studentPortalService.hostelStatus(),
    enabled,
  });
}

export function useStudentBills(enabled: boolean) {
  return useQuery({
    queryKey: ["student-portal", "bills"],
    queryFn: () => studentPortalService.bills(),
    enabled,
  });
}

export function usePaystackPayLink() {
  return useMutation({
    mutationFn: (amount: number) => studentPortalService.payLink(amount),
  });
}

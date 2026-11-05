import { apiClient } from "@/lib/axios";
import type {
  AcademicSummary,
  HostelStatus,
  PaystackLinkResponse,
  StudentBills,
} from "@/types/student-portal";

export const studentPortalService = {
  async academicSummary(): Promise<AcademicSummary> {
    const { data } = await apiClient.get<AcademicSummary>(
      "/student-portal/academic-summary",
    );
    return data;
  },

  async hostelStatus(): Promise<HostelStatus> {
    const { data } = await apiClient.get<HostelStatus>(
      "/student-portal/hostel-status",
    );
    return data;
  },

  async bills(): Promise<StudentBills> {
    const { data } = await apiClient.get<StudentBills>("/student-portal/bills");
    return data;
  },

  async payLink(amount: number): Promise<PaystackLinkResponse> {
    const { data } = await apiClient.post<PaystackLinkResponse>(
      "/student-portal/bills/pay-link",
      { amount },
    );
    return data;
  },
};

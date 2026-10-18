import { apiClient } from "@/lib/axios";
import type {
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  StaffLeaveBalances,
} from "@/types/leave";

export type LeaveTypeFormPayload = {
  name: string;
  defaultDaysPerYear: number;
  rollover: boolean;
  maxRolloverDays?: number;
  /** Update only: clears maxRolloverDays back to "no cap". */
  clearMaxRolloverDays?: boolean;
};

export type CreateLeaveRequestPayload = {
  leaveTypeId: string;
  /** "yyyy-MM-dd". */
  startDate: string;
  /** "yyyy-MM-dd". */
  endDate: string;
  reason: string;
};

export type SubmitResumptionPayload = {
  /** "yyyy-MM-dd" — the first day NOT on leave. */
  resumptionDate: string;
  note: string;
  /** Required only when submitting after the leave's endDate has already passed — the backend enforces this, not the client. */
  lateReason?: string;
};

export const leaveService = {
  // --- Admin: leave types ---
  async listTypes(): Promise<LeaveType[]> {
    const { data } = await apiClient.get<LeaveType[]>("/leave/types");
    return data;
  },

  async createType(payload: LeaveTypeFormPayload): Promise<LeaveType> {
    const { data } = await apiClient.post<LeaveType>("/leave/types", payload);
    return data;
  },

  async updateType(
    id: string,
    payload: Partial<LeaveTypeFormPayload>,
  ): Promise<LeaveType> {
    const { data } = await apiClient.patch<LeaveType>(
      `/leave/types/${id}`,
      payload,
    );
    return data;
  },

  async archiveType(id: string): Promise<LeaveType> {
    const { data } = await apiClient.post<LeaveType>(
      `/leave/types/${id}/archive`,
    );
    return data;
  },

  async restoreType(id: string): Promise<LeaveType> {
    const { data } = await apiClient.post<LeaveType>(
      `/leave/types/${id}/restore`,
    );
    return data;
  },

  // --- Admin: requests & balances ---
  async listRequests(
    params: {
      status?: string;
      staffId?: string;
      resumptionStatus?: string;
    } = {},
  ): Promise<LeaveRequest[]> {
    const { data } = await apiClient.get<LeaveRequest[]>("/leave/requests", {
      params,
    });
    return data;
  },

  async approve(id: string, note?: string): Promise<LeaveRequest> {
    const { data } = await apiClient.post<LeaveRequest>(
      `/leave/requests/${id}/approve`,
      { note },
    );
    return data;
  },

  async reject(id: string, note: string): Promise<LeaveRequest> {
    const { data } = await apiClient.post<LeaveRequest>(
      `/leave/requests/${id}/reject`,
      { note },
    );
    return data;
  },

  /** Admin confirms a staff member's reported resumption date — the action that actually moves days. */
  async approveResumption(id: string, note?: string): Promise<LeaveRequest> {
    const { data } = await apiClient.post<LeaveRequest>(
      `/leave/requests/${id}/resumption/approve`,
      { note },
    );
    return data;
  },

  async rejectResumption(id: string, note: string): Promise<LeaveRequest> {
    const { data } = await apiClient.post<LeaveRequest>(
      `/leave/requests/${id}/resumption/reject`,
      { note },
    );
    return data;
  },

  async listBalances(year?: number): Promise<StaffLeaveBalances[]> {
    const { data } = await apiClient.get<StaffLeaveBalances[]>(
      "/leave/balances",
      { params: { year } },
    );
    return data;
  },

  // --- Self-service ---
  async myTypes(): Promise<LeaveType[]> {
    const { data } = await apiClient.get<LeaveType[]>("/leave/my/types");
    return data;
  },

  async myRequests(): Promise<LeaveRequest[]> {
    const { data } = await apiClient.get<LeaveRequest[]>("/leave/my/requests");
    return data;
  },

  async createRequest(
    payload: CreateLeaveRequestPayload,
  ): Promise<LeaveRequest> {
    const { data } = await apiClient.post<LeaveRequest>(
      "/leave/my/requests",
      payload,
    );
    return data;
  },

  async cancelRequest(id: string): Promise<LeaveRequest> {
    const { data } = await apiClient.post<LeaveRequest>(
      `/leave/my/requests/${id}/cancel`,
    );
    return data;
  },

  async submitResumption(
    id: string,
    payload: SubmitResumptionPayload,
  ): Promise<LeaveRequest> {
    const { data } = await apiClient.post<LeaveRequest>(
      `/leave/my/requests/${id}/resume`,
      payload,
    );
    return data;
  },

  async myBalance(year?: number): Promise<LeaveBalance[]> {
    const { data } = await apiClient.get<LeaveBalance[]>("/leave/my/balance", {
      params: { year },
    });
    return data;
  },
};

import { apiClient } from "@/lib/axios";
import type {
  AttendanceDevice,
  AttendanceDeviceCreated,
  AttendanceEvent,
  AttendanceOverview,
  AttendanceSettings,
  AttendanceTrendPoint,
  AttendanceWorkday,
  DailyAttendanceEntry,
} from "@/types/attendance";

export type UpdateAttendanceSettingsPayload = {
  resumptionTime?: string;
  closingTime?: string;
  gracePeriodMinutes?: number;
  workdays?: AttendanceWorkday[];
};

export type CreateAttendanceDevicePayload = {
  name: string;
  location?: string;
};

export type RecordManualAttendancePayload = {
  staffId: string;
  eventType: "CLOCK_IN" | "CLOCK_OUT";
  /** ISO instant. */
  occurredAt: string;
  note: string;
};

export const attendanceService = {
  async getSettings(): Promise<AttendanceSettings> {
    const { data } = await apiClient.get<AttendanceSettings>(
      "/attendance/settings",
    );
    return data;
  },

  async updateSettings(
    payload: UpdateAttendanceSettingsPayload,
  ): Promise<AttendanceSettings> {
    const { data } = await apiClient.patch<AttendanceSettings>(
      "/attendance/settings",
      payload,
    );
    return data;
  },

  async listDevices(): Promise<AttendanceDevice[]> {
    const { data } = await apiClient.get<AttendanceDevice[]>(
      "/attendance/devices",
    );
    return data;
  },

  async createDevice(
    payload: CreateAttendanceDevicePayload,
  ): Promise<AttendanceDeviceCreated> {
    const { data } = await apiClient.post<AttendanceDeviceCreated>(
      "/attendance/devices",
      payload,
    );
    return data;
  },

  async revokeDevice(id: string): Promise<AttendanceDevice> {
    const { data } = await apiClient.delete<AttendanceDevice>(
      `/attendance/devices/${id}`,
    );
    return data;
  },

  async getOverview(date?: string): Promise<AttendanceOverview> {
    const { data } = await apiClient.get<AttendanceOverview>(
      "/attendance/overview",
      { params: { date } },
    );
    return data;
  },

  async getTrend(days = 14): Promise<AttendanceTrendPoint[]> {
    const { data } = await apiClient.get<AttendanceTrendPoint[]>(
      "/attendance/trend",
      { params: { days } },
    );
    return data;
  },

  async getStaffHistory(
    staffId: string,
    from: string,
    to: string,
  ): Promise<DailyAttendanceEntry[]> {
    const { data } = await apiClient.get<DailyAttendanceEntry[]>(
      `/attendance/staff/${staffId}/history`,
      { params: { from, to } },
    );
    return data;
  },

  async recordManualEntry(
    payload: RecordManualAttendancePayload,
  ): Promise<AttendanceEvent> {
    const { data } = await apiClient.post<AttendanceEvent>(
      "/attendance/manual-entries",
      payload,
    );
    return data;
  },

  async getMyToday(): Promise<DailyAttendanceEntry[]> {
    const { data } = await apiClient.get<DailyAttendanceEntry[]>(
      "/attendance/my/today",
    );
    return data;
  },

  async getMyHistory(
    from: string,
    to: string,
  ): Promise<DailyAttendanceEntry[]> {
    const { data } = await apiClient.get<DailyAttendanceEntry[]>(
      "/attendance/my/history",
      { params: { from, to } },
    );
    return data;
  },
};

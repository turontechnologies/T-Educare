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

export interface AttendanceImportResult {
  imported: number;
  skipped: number;
}

export type AttendanceExportFormat = "csv" | "xlsx" | "pdf";

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

  async getOverview(
    date?: string,
    departmentId?: string,
  ): Promise<AttendanceOverview> {
    const { data } = await apiClient.get<AttendanceOverview>(
      "/attendance/overview",
      { params: { date, departmentId } },
    );
    return data;
  },

  async getTrend(
    days = 14,
    departmentId?: string,
  ): Promise<AttendanceTrendPoint[]> {
    const { data } = await apiClient.get<AttendanceTrendPoint[]>(
      "/attendance/trend",
      { params: { days, departmentId } },
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

  async importManualEntries(file: File): Promise<AttendanceImportResult> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<AttendanceImportResult>(
      "/attendance/manual-entries/import",
      formData,
    );
    return data;
  },

  async exportManualEntries(
    from: string,
    to: string,
    format: AttendanceExportFormat = "csv",
  ): Promise<Blob> {
    const { data } = await apiClient.get("/attendance/manual-entries/export", {
      params: { from, to, format },
      responseType: "blob",
    });
    return data;
  },

  async downloadManualEntriesTemplate(): Promise<Blob> {
    const { data } = await apiClient.get(
      "/attendance/manual-entries/import-template",
      { responseType: "blob" },
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

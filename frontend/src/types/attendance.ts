export const ATTENDANCE_WORKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
export type AttendanceWorkday = (typeof ATTENDANCE_WORKDAYS)[number];

export interface AttendanceSettings {
  /** "HH:mm", 24-hour. */
  resumptionTime: string;
  /** "HH:mm", 24-hour. */
  closingTime: string;
  gracePeriodMinutes: number;
  workdays: AttendanceWorkday[];
  updatedAt: string;
}

export type AttendanceDeviceStatus = "active" | "revoked";

/** `location`/`lastSeenAt`/`revokedAt` are omitted entirely from the JSON (not sent as explicit `null`) whenever unset — the backend's ObjectMapper is configured to skip nulls, same as every other response in this app. */
export interface AttendanceDevice {
  id: string;
  name: string;
  location?: string;
  status: AttendanceDeviceStatus;
  lastSeenAt?: string;
  createdAt: string;
  revokedAt?: string;
}

/** Returned exactly once, at creation — the plaintext apiKey is never retrievable again. */
export interface AttendanceDeviceCreated {
  device: AttendanceDevice;
  apiKey: string;
}

export type AttendanceEventType = "CLOCK_IN" | "CLOCK_OUT";
export type AttendanceEventSource = "DEVICE" | "MANUAL";

export interface AttendanceEvent {
  id: string;
  staffId: string;
  eventType: AttendanceEventType;
  occurredAt: string;
  deviceId?: string;
  source: AttendanceEventSource;
  note?: string;
  createdAt: string;
}

export type DailyAttendanceStatus =
  "PRESENT" | "LATE" | "ABSENT" | "NOT_CLOCKED_IN" | "NON_WORKDAY";

/**
 * One staff member's derived attendance for one calendar day — never
 * fetched/stored as a persisted record, always a read-time computation on
 * the backend. `clockInAt`/`clockOutAt` are omitted entirely from the JSON
 * when there's no matching event yet, not sent as explicit `null`.
 */
export interface DailyAttendanceEntry {
  staffId: string;
  staffCode: string;
  staffName: string;
  status: DailyAttendanceStatus;
  clockInAt?: string;
  clockOutAt?: string;
}

export interface AttendanceOverview {
  /** "yyyy-MM-dd". */
  date: string;
  workday: boolean;
  totalStaff: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  notClockedInCount: number;
  entries: DailyAttendanceEntry[];
}

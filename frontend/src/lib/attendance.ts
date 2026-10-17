import { format } from "date-fns";
import type {
  AttendanceWorkday,
  DailyAttendanceStatus,
} from "@/types/attendance";

export const WORKDAY_LABELS: Record<AttendanceWorkday, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export const STATUS_LABELS: Record<DailyAttendanceStatus, string> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT: "Absent",
  NOT_CLOCKED_IN: "Not Clocked In",
  NON_WORKDAY: "Non-Workday",
};

/** Matches the dot-plus-tint convention used for disciplinary/license-status badges elsewhere in the app. */
export const STATUS_BADGE_CLASSES: Record<DailyAttendanceStatus, string> = {
  PRESENT: "bg-emerald-500/10 text-emerald-600",
  LATE: "bg-amber-500/10 text-amber-600",
  ABSENT: "bg-destructive/10 text-destructive",
  NOT_CLOCKED_IN: "bg-muted text-muted-foreground",
  NON_WORKDAY: "bg-secondary/10 text-secondary",
};

/** "yyyy-MM-dd" for whatever date the caller means "today" as, in the browser's own local time. */
export function todayIsoDate(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatClockTime(instant?: string): string {
  if (!instant) return "—";
  return format(new Date(instant), "h:mm a");
}

export function formatDisplayDate(isoDate: string): string {
  return format(new Date(`${isoDate}T00:00:00`), "EEEE, d MMMM yyyy");
}

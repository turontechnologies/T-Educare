import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  attendanceService,
  type CreateAttendanceDevicePayload,
  type RecordManualAttendancePayload,
  type UpdateAttendanceSettingsPayload,
} from "@/services/attendance.service";

const SETTINGS_KEY = "attendance-settings";
const DEVICES_KEY = "attendance-devices";
const OVERVIEW_KEY = "attendance-overview";
const STAFF_HISTORY_KEY = "attendance-staff-history";
const MY_TODAY_KEY = "attendance-my-today";
const MY_HISTORY_KEY = "attendance-my-history";

export function useAttendanceSettings(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [SETTINGS_KEY],
    queryFn: () => attendanceService.getSettings(),
    enabled: options.enabled ?? true,
  });
}

export function useUpdateAttendanceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateAttendanceSettingsPayload) =>
      attendanceService.updateSettings(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [SETTINGS_KEY] }),
  });
}

export function useAttendanceDevices(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [DEVICES_KEY],
    queryFn: () => attendanceService.listDevices(),
    enabled: options.enabled ?? true,
  });
}

function useInvalidateDevices() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [DEVICES_KEY] });
}

export function useCreateAttendanceDevice() {
  const invalidate = useInvalidateDevices();
  return useMutation({
    mutationFn: (payload: CreateAttendanceDevicePayload) =>
      attendanceService.createDevice(payload),
    onSuccess: invalidate,
  });
}

export function useRevokeAttendanceDevice() {
  const invalidate = useInvalidateDevices();
  return useMutation({
    mutationFn: (id: string) => attendanceService.revokeDevice(id),
    onSuccess: invalidate,
  });
}

export function useAttendanceOverview(
  date: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [OVERVIEW_KEY, date],
    queryFn: () => attendanceService.getOverview(date),
    enabled: options.enabled ?? true,
    refetchInterval: 60_000,
  });
}

export function useAttendanceTrend(
  days = 14,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["attendance-trend", days],
    queryFn: () => attendanceService.getTrend(days),
    enabled: options.enabled ?? true,
    refetchInterval: 60_000,
  });
}

export function useStaffAttendanceHistory(
  staffId: string | undefined,
  from: string,
  to: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [STAFF_HISTORY_KEY, staffId, from, to],
    queryFn: () => attendanceService.getStaffHistory(staffId!, from, to),
    enabled: (options.enabled ?? true) && !!staffId,
  });
}

export function useRecordManualAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordManualAttendancePayload) =>
      attendanceService.recordManualEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OVERVIEW_KEY] });
      queryClient.invalidateQueries({ queryKey: [STAFF_HISTORY_KEY] });
    },
  });
}

export function useMyAttendanceToday(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [MY_TODAY_KEY],
    queryFn: () => attendanceService.getMyToday(),
    enabled: options.enabled ?? true,
    refetchInterval: 60_000,
  });
}

export function useMyAttendanceHistory(
  from: string,
  to: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [MY_HISTORY_KEY, from, to],
    queryFn: () => attendanceService.getMyHistory(from, to),
    enabled: options.enabled ?? true,
  });
}

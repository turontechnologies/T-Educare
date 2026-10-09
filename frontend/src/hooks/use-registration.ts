import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  courseRegistrationService,
  registrationSettingsService,
  type ReplaceCourseRegistrationsPayload,
  type UpdateRegistrationSettingsPayload,
} from "@/services/registration.service";

export function useRegistrationSettings(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["registration-settings"],
    queryFn: () => registrationSettingsService.get(),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

export function useUpdateRegistrationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRegistrationSettingsPayload) =>
      registrationSettingsService.update(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["registration-settings"] }),
  });
}

export function useCourseRegistrations(
  studentId: string | undefined,
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["course-registrations", studentId, academicSemesterId],
    queryFn: () =>
      courseRegistrationService.list(studentId!, academicSemesterId!),
    enabled: (options.enabled ?? true) && !!studentId && !!academicSemesterId,
  });
}

export function useReplaceCourseRegistrations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReplaceCourseRegistrationsPayload) =>
      courseRegistrationService.replace(payload),
    onSuccess: (_data, { studentId, academicSemesterId }) =>
      queryClient.invalidateQueries({
        queryKey: ["course-registrations", studentId, academicSemesterId],
      }),
  });
}

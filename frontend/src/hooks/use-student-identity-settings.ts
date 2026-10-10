import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { studentIdentitySettingsService } from "@/services/student-identity-settings.service";
import type { StudentIdentitySettings } from "@/types/student";

const STUDENT_IDENTITY_SETTINGS_KEY = "student-identity-settings";

export function useStudentIdentitySettings(
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [STUDENT_IDENTITY_SETTINGS_KEY],
    queryFn: () => studentIdentitySettingsService.get(),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

export function useUpdateStudentIdentitySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StudentIdentitySettings) =>
      studentIdentitySettingsService.update(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [STUDENT_IDENTITY_SETTINGS_KEY],
      }),
  });
}

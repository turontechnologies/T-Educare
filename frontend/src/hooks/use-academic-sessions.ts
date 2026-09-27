import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  academicSessionService,
  type AcademicSessionFormPayload,
} from "@/services/academic-session.service";

const ACADEMIC_SESSIONS_KEY = "academic-sessions";

export function useAcademicSessions(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [ACADEMIC_SESSIONS_KEY, includeArchived],
    queryFn: () => academicSessionService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateSessions() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [ACADEMIC_SESSIONS_KEY] });
}

export function useCreateAcademicSession() {
  const invalidate = useInvalidateSessions();
  return useMutation({
    mutationFn: (payload: AcademicSessionFormPayload) =>
      academicSessionService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAcademicSession() {
  const invalidate = useInvalidateSessions();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<AcademicSessionFormPayload>;
    }) => academicSessionService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveAcademicSession() {
  const invalidate = useInvalidateSessions();
  return useMutation({
    mutationFn: (id: string) => academicSessionService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreAcademicSession() {
  const invalidate = useInvalidateSessions();
  return useMutation({
    mutationFn: (id: string) => academicSessionService.restore(id),
    onSuccess: invalidate,
  });
}

export function useSetCurrentAcademicSession() {
  const invalidate = useInvalidateSessions();
  return useMutation({
    mutationFn: (id: string) => academicSessionService.setCurrent(id),
    onSuccess: invalidate,
  });
}

export function useCloseAcademicSession() {
  const invalidate = useInvalidateSessions();
  return useMutation({
    mutationFn: (id: string) => academicSessionService.close(id),
    onSuccess: invalidate,
  });
}

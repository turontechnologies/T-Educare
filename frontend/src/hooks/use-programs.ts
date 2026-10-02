import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  programService,
  type ProgramFormPayload,
} from "@/services/program.service";

const PROGRAMS_KEY = "programs";

export function usePrograms(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [PROGRAMS_KEY, includeArchived],
    queryFn: () => programService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidatePrograms() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [PROGRAMS_KEY] });
}

export function useCreateProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: (payload: ProgramFormPayload) => programService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ProgramFormPayload>;
    }) => programService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: (id: string) => programService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: (id: string) => programService.restore(id),
    onSuccess: invalidate,
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  programLevelService,
  type ProgramLevelFormPayload,
} from "@/services/program-level.service";

const PROGRAM_LEVELS_KEY = "program-levels";

export function useProgramLevels(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [PROGRAM_LEVELS_KEY, includeArchived],
    queryFn: () => programLevelService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateProgramLevels() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [PROGRAM_LEVELS_KEY] });
}

export function useCreateProgramLevel() {
  const invalidate = useInvalidateProgramLevels();
  return useMutation({
    mutationFn: (payload: ProgramLevelFormPayload) =>
      programLevelService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateProgramLevel() {
  const invalidate = useInvalidateProgramLevels();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ProgramLevelFormPayload>;
    }) => programLevelService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveProgramLevel() {
  const invalidate = useInvalidateProgramLevels();
  return useMutation({
    mutationFn: (id: string) => programLevelService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreProgramLevel() {
  const invalidate = useInvalidateProgramLevels();
  return useMutation({
    mutationFn: (id: string) => programLevelService.restore(id),
    onSuccess: invalidate,
  });
}

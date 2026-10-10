import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  electiveGroupService,
  type ElectiveGroupFormPayload,
} from "@/services/elective-group.service";

const ELECTIVE_GROUPS_KEY = "elective-groups";

export function useElectiveGroups(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [ELECTIVE_GROUPS_KEY, includeArchived],
    queryFn: () => electiveGroupService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateElectiveGroups() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [ELECTIVE_GROUPS_KEY] });
}

export function useCreateElectiveGroup() {
  const invalidate = useInvalidateElectiveGroups();
  return useMutation({
    mutationFn: (payload: ElectiveGroupFormPayload) =>
      electiveGroupService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateElectiveGroup() {
  const invalidate = useInvalidateElectiveGroups();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ElectiveGroupFormPayload>;
    }) => electiveGroupService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveElectiveGroup() {
  const invalidate = useInvalidateElectiveGroups();
  return useMutation({
    mutationFn: (id: string) => electiveGroupService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreElectiveGroup() {
  const invalidate = useInvalidateElectiveGroups();
  return useMutation({
    mutationFn: (id: string) => electiveGroupService.restore(id),
    onSuccess: invalidate,
  });
}

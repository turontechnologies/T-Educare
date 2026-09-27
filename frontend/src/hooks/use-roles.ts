import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { roleService, type RoleFormPayload } from "@/services/role.service";

const ROLES_KEY = "roles";

/**
 * `institutionId` is only needed for a super_admin caller viewing a
 * specific institution's roles (see role.service.ts); an institution_admin
 * always gets their own regardless. Pass `enabled: false` while no
 * institution is selected yet (e.g. the super admin's "Add" form before an
 * institution is picked) to avoid a guaranteed-400 fetch.
 */
export function useRoles(
  institutionId?: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [ROLES_KEY, institutionId ?? "own"],
    queryFn: () => roleService.list(institutionId),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RoleFormPayload) => roleService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROLES_KEY] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<RoleFormPayload>;
    }) => roleService.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROLES_KEY] }),
  });
}

export function useArchiveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleService.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROLES_KEY] }),
  });
}

export function useRestoreRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleService.restore(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROLES_KEY] }),
  });
}

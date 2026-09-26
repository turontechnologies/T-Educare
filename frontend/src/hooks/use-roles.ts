import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { roleService, type RoleFormPayload } from "@/services/role.service";

const ROLES_KEY = "roles";

export function useRoles() {
  return useQuery({
    queryKey: [ROLES_KEY],
    queryFn: () => roleService.list(),
    staleTime: 30_000,
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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  userManagerService,
  type UserManagerFormPayload,
  type UserManagersListParams,
} from "@/services/user-manager.service";
import type { UserManagerStatus } from "@/types/user-manager";

const userManagersKey = (params: UserManagersListParams) => [
  "user-managers",
  params,
];

export function useUserManagers(
  params: UserManagersListParams = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: userManagersKey(params),
    queryFn: () => userManagerService.list(params),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

export function useCreateUserManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserManagerFormPayload) =>
      userManagerService.create(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["user-managers"] }),
  });
}

export function useUpdateUserManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<UserManagerFormPayload>;
    }) => userManagerService.update(id, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["user-managers"] }),
  });
}

export function useUpdateUserManagerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserManagerStatus }) =>
      userManagerService.updateStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["user-managers"] }),
  });
}

export function useArchiveUserManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userManagerService.archive(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["user-managers"] }),
  });
}

export function useRestoreUserManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userManagerService.restore(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["user-managers"] }),
  });
}

export function useResetUserManagerPassword() {
  return useMutation({
    mutationFn: (id: string) => userManagerService.resetPassword(id),
  });
}

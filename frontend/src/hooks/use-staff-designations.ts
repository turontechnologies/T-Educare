import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  staffDesignationService,
  type StaffDesignationFormPayload,
} from "@/services/staff-designation.service";

const STAFF_DESIGNATIONS_KEY = "staff-designations";

export function useStaffDesignations(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [STAFF_DESIGNATIONS_KEY, includeArchived],
    queryFn: () => staffDesignationService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateStaffDesignations() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [STAFF_DESIGNATIONS_KEY] });
}

export function useCreateStaffDesignation() {
  const invalidate = useInvalidateStaffDesignations();
  return useMutation({
    mutationFn: (payload: StaffDesignationFormPayload) =>
      staffDesignationService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateStaffDesignation() {
  const invalidate = useInvalidateStaffDesignations();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<StaffDesignationFormPayload>;
    }) => staffDesignationService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveStaffDesignation() {
  const invalidate = useInvalidateStaffDesignations();
  return useMutation({
    mutationFn: (id: string) => staffDesignationService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreStaffDesignation() {
  const invalidate = useInvalidateStaffDesignations();
  return useMutation({
    mutationFn: (id: string) => staffDesignationService.restore(id),
    onSuccess: invalidate,
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  departmentService,
  type DepartmentFormPayload,
} from "@/services/department.service";

const DEPARTMENTS_KEY = "departments";

export function useDepartments(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [DEPARTMENTS_KEY, includeArchived],
    queryFn: () => departmentService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateDepartments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
}

export function useCreateDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (payload: DepartmentFormPayload) =>
      departmentService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<DepartmentFormPayload>;
    }) => departmentService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (id: string) => departmentService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreDepartment() {
  const invalidate = useInvalidateDepartments();
  return useMutation({
    mutationFn: (id: string) => departmentService.restore(id),
    onSuccess: invalidate,
  });
}

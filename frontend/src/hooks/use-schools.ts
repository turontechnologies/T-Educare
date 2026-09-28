import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  schoolService,
  type SchoolFormPayload,
} from "@/services/school.service";

const SCHOOLS_KEY = "schools";

export function useSchools(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [SCHOOLS_KEY, includeArchived],
    queryFn: () => schoolService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateSchools() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [SCHOOLS_KEY] });
}

export function useCreateSchool() {
  const invalidate = useInvalidateSchools();
  return useMutation({
    mutationFn: (payload: SchoolFormPayload) => schoolService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateSchool() {
  const invalidate = useInvalidateSchools();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<SchoolFormPayload>;
    }) => schoolService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveSchool() {
  const invalidate = useInvalidateSchools();
  return useMutation({
    mutationFn: (id: string) => schoolService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreSchool() {
  const invalidate = useInvalidateSchools();
  return useMutation({
    mutationFn: (id: string) => schoolService.restore(id),
    onSuccess: invalidate,
  });
}

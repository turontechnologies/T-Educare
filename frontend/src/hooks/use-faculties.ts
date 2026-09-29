import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  facultyService,
  type FacultyFormPayload,
} from "@/services/faculty.service";

const FACULTIES_KEY = "faculties";

export function useFaculties(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [FACULTIES_KEY, includeArchived],
    queryFn: () => facultyService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateFaculties() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [FACULTIES_KEY] });
}

export function useCreateFaculty() {
  const invalidate = useInvalidateFaculties();
  return useMutation({
    mutationFn: (payload: FacultyFormPayload) => facultyService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateFaculty() {
  const invalidate = useInvalidateFaculties();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<FacultyFormPayload>;
    }) => facultyService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveFaculty() {
  const invalidate = useInvalidateFaculties();
  return useMutation({
    mutationFn: (id: string) => facultyService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreFaculty() {
  const invalidate = useInvalidateFaculties();
  return useMutation({
    mutationFn: (id: string) => facultyService.restore(id),
    onSuccess: invalidate,
  });
}

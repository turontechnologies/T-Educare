import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  academicSemesterService,
  type AcademicSemesterFormPayload,
} from "@/services/academic-semester.service";

const ACADEMIC_SEMESTERS_KEY = "academic-semesters";

export function useAcademicSemesters(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [ACADEMIC_SEMESTERS_KEY, includeArchived],
    queryFn: () => academicSemesterService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateSemesters() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [ACADEMIC_SEMESTERS_KEY] });
}

export function useCreateAcademicSemester() {
  const invalidate = useInvalidateSemesters();
  return useMutation({
    mutationFn: (payload: AcademicSemesterFormPayload) =>
      academicSemesterService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAcademicSemester() {
  const invalidate = useInvalidateSemesters();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<AcademicSemesterFormPayload>;
    }) => academicSemesterService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveAcademicSemester() {
  const invalidate = useInvalidateSemesters();
  return useMutation({
    mutationFn: (id: string) => academicSemesterService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreAcademicSemester() {
  const invalidate = useInvalidateSemesters();
  return useMutation({
    mutationFn: (id: string) => academicSemesterService.restore(id),
    onSuccess: invalidate,
  });
}

export function useSetCurrentAcademicSemester() {
  const invalidate = useInvalidateSemesters();
  return useMutation({
    mutationFn: (id: string) => academicSemesterService.setCurrent(id),
    onSuccess: invalidate,
  });
}

export function useCloseAcademicSemester() {
  const invalidate = useInvalidateSemesters();
  return useMutation({
    mutationFn: (id: string) => academicSemesterService.close(id),
    onSuccess: invalidate,
  });
}

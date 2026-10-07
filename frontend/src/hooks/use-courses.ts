import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  courseService,
  type CourseFormPayload,
} from "@/services/course.service";

const COURSES_KEY = "courses";

export function useCourses(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [COURSES_KEY, includeArchived],
    queryFn: () => courseService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateCourses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [COURSES_KEY] });
}

export function useCreateCourse() {
  const invalidate = useInvalidateCourses();
  return useMutation({
    mutationFn: (payload: CourseFormPayload) => courseService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateCourse() {
  const invalidate = useInvalidateCourses();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CourseFormPayload>;
    }) => courseService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveCourse() {
  const invalidate = useInvalidateCourses();
  return useMutation({
    mutationFn: (id: string) => courseService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreCourse() {
  const invalidate = useInvalidateCourses();
  return useMutation({
    mutationFn: (id: string) => courseService.restore(id),
    onSuccess: invalidate,
  });
}

export function useImportCourses() {
  const invalidate = useInvalidateCourses();
  return useMutation({
    mutationFn: (file: File) => courseService.import(file),
    onSuccess: invalidate,
  });
}

export function useExportCourses() {
  return useMutation({
    mutationFn: (includeArchived: boolean) =>
      courseService.export(includeArchived),
  });
}

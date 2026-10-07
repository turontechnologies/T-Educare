import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  courseGradeService,
  type CourseGradeFormPayload,
} from "@/services/course-grade.service";

const COURSE_GRADES_KEY = "course-grades";

export function useCourseGrades(
  includeArchived = false,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [COURSE_GRADES_KEY, includeArchived],
    queryFn: () => courseGradeService.list(includeArchived),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateCourseGrades() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [COURSE_GRADES_KEY] });
}

export function useCreateCourseGrade() {
  const invalidate = useInvalidateCourseGrades();
  return useMutation({
    mutationFn: (payload: CourseGradeFormPayload) =>
      courseGradeService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateCourseGrade() {
  const invalidate = useInvalidateCourseGrades();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CourseGradeFormPayload>;
    }) => courseGradeService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useArchiveCourseGrade() {
  const invalidate = useInvalidateCourseGrades();
  return useMutation({
    mutationFn: (id: string) => courseGradeService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreCourseGrade() {
  const invalidate = useInvalidateCourseGrades();
  return useMutation({
    mutationFn: (id: string) => courseGradeService.restore(id),
    onSuccess: invalidate,
  });
}

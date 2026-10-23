import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  courseResultService,
  type CreateCourseResultPayload,
} from "@/services/course-result.service";

const RESULTS_KEY = "course-results";

export function useCourseResultsForCourse(
  courseId: string | undefined,
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [RESULTS_KEY, "course", courseId, academicSemesterId],
    queryFn: () =>
      courseResultService.listForCourse(courseId!, academicSemesterId!),
    enabled: (options.enabled ?? true) && !!courseId && !!academicSemesterId,
  });
}

export function useCourseResultsForStudent(
  studentId: string | undefined,
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [RESULTS_KEY, "student", studentId, academicSemesterId],
    queryFn: () =>
      courseResultService.listForStudent(studentId!, academicSemesterId!),
    enabled: (options.enabled ?? true) && !!studentId && !!academicSemesterId,
  });
}

export function useMyResultCourses(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [RESULTS_KEY, "my-courses"],
    queryFn: () => courseResultService.myCourses(),
    enabled: options.enabled ?? true,
  });
}

function useInvalidateResults() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [RESULTS_KEY] });
  };
}

export function useCreateCourseResult() {
  const invalidate = useInvalidateResults();
  return useMutation({
    mutationFn: (payload: CreateCourseResultPayload) =>
      courseResultService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateCourseResult() {
  const invalidate = useInvalidateResults();
  return useMutation({
    mutationFn: ({ id, score }: { id: string; score: number }) =>
      courseResultService.update(id, score),
    onSuccess: invalidate,
  });
}

export function useDeleteCourseResult() {
  const invalidate = useInvalidateResults();
  return useMutation({
    mutationFn: (id: string) => courseResultService.delete(id),
    onSuccess: invalidate,
  });
}

export function useStudentGpa(
  studentId: string | undefined,
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [RESULTS_KEY, "gpa", studentId, academicSemesterId],
    queryFn: () => courseResultService.gpa(studentId!, academicSemesterId!),
    enabled: (options.enabled ?? true) && !!studentId && !!academicSemesterId,
  });
}

export function useStudentCgpa(
  studentId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [RESULTS_KEY, "cgpa", studentId],
    queryFn: () => courseResultService.cgpa(studentId!),
    enabled: (options.enabled ?? true) && !!studentId,
  });
}

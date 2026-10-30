import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  courseResultService,
  type GracePeriodPayload,
  type MarkingGuidePayload,
  type StudentScorePayload,
} from "@/services/course-result.service";

const RESULTS_KEY = "course-results";

export function useMarkingGuide() {
  return useQuery({
    queryKey: [RESULTS_KEY, "marking-guide"],
    queryFn: () => courseResultService.getMarkingGuide(),
  });
}

export function useUpdateMarkingGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MarkingGuidePayload) =>
      courseResultService.updateMarkingGuide(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [RESULTS_KEY] }),
  });
}

export function useGracePeriod() {
  return useQuery({
    queryKey: [RESULTS_KEY, "grace-period"],
    queryFn: () => courseResultService.getGracePeriod(),
  });
}

export function useUpdateGracePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GracePeriodPayload) =>
      courseResultService.updateGracePeriod(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [RESULTS_KEY, "grace-period"],
      }),
  });
}

export function useCourseResultList(
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [RESULTS_KEY, "courses", academicSemesterId],
    queryFn: () => courseResultService.listCourses(academicSemesterId!),
    enabled: (options.enabled ?? true) && !!academicSemesterId,
  });
}

export function useCourseReview(
  courseId: string | undefined,
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [RESULTS_KEY, "review", courseId, academicSemesterId],
    queryFn: () => courseResultService.review(courseId!, academicSemesterId!),
    enabled: (options.enabled ?? true) && !!courseId && !!academicSemesterId,
  });
}

function useInvalidateResults() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [RESULTS_KEY] });
}

export function usePublishCourseResult() {
  const invalidate = useInvalidateResults();
  return useMutation({
    mutationFn: ({
      courseId,
      academicSemesterId,
    }: {
      courseId: string;
      academicSemesterId: string;
    }) => courseResultService.publish(courseId, academicSemesterId),
    onSuccess: invalidate,
  });
}

export function useUnpublishCourseResult() {
  const invalidate = useInvalidateResults();
  return useMutation({
    mutationFn: ({
      courseId,
      academicSemesterId,
      reason,
    }: {
      courseId: string;
      academicSemesterId: string;
      reason: string;
    }) => courseResultService.unpublish(courseId, academicSemesterId, reason),
    onSuccess: invalidate,
  });
}

export function useCourseResultHistory(
  courseId: string | undefined,
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [RESULTS_KEY, "history", courseId, academicSemesterId],
    queryFn: () => courseResultService.history(courseId!, academicSemesterId!),
    enabled: (options.enabled ?? true) && !!courseId && !!academicSemesterId,
  });
}

export function useMyCourseProgress(
  courseId: string | undefined,
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [RESULTS_KEY, "my-course", courseId, academicSemesterId],
    queryFn: () =>
      courseResultService.myCourseProgress(courseId!, academicSemesterId!),
    enabled: (options.enabled ?? true) && !!courseId && !!academicSemesterId,
  });
}

export function useComponentScores(
  courseId: string | undefined,
  componentId: string | undefined,
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [
      RESULTS_KEY,
      "component-scores",
      courseId,
      componentId,
      academicSemesterId,
    ],
    queryFn: () =>
      courseResultService.componentScores(
        courseId!,
        componentId!,
        academicSemesterId!,
      ),
    enabled:
      (options.enabled ?? true) &&
      !!courseId &&
      !!componentId &&
      !!academicSemesterId,
  });
}

export function useSaveComponentScores() {
  const invalidate = useInvalidateResults();
  return useMutation({
    mutationFn: ({
      courseId,
      componentId,
      academicSemesterId,
      scores,
    }: {
      courseId: string;
      componentId: string;
      academicSemesterId: string;
      scores: StudentScorePayload[];
    }) =>
      courseResultService.saveComponentScores(
        courseId,
        componentId,
        academicSemesterId,
        scores,
      ),
    onSuccess: invalidate,
  });
}

export function useBulkUploadScores() {
  const invalidate = useInvalidateResults();
  return useMutation({
    mutationFn: ({
      courseId,
      academicSemesterId,
      file,
    }: {
      courseId: string;
      academicSemesterId: string;
      file: File;
    }) =>
      courseResultService.bulkUploadScores(courseId, academicSemesterId, file),
    onSuccess: invalidate,
  });
}

export function useBulkUploadScoresTemplate() {
  return useMutation({
    mutationFn: ({
      courseId,
      academicSemesterId,
    }: {
      courseId: string;
      academicSemesterId: string;
    }) => courseResultService.bulkUploadTemplate(courseId, academicSemesterId),
  });
}

export function useSubmitCourseResult() {
  const invalidate = useInvalidateResults();
  return useMutation({
    mutationFn: ({
      courseId,
      academicSemesterId,
    }: {
      courseId: string;
      academicSemesterId: string;
    }) => courseResultService.submit(courseId, academicSemesterId),
    onSuccess: invalidate,
  });
}

export function useDepartmentGroups(
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [RESULTS_KEY, "departments", academicSemesterId],
    queryFn: () =>
      courseResultService.listDepartmentGroups(academicSemesterId!),
    enabled: (options.enabled ?? true) && !!academicSemesterId,
  });
}

export function useDepartmentGroupDetail(
  departmentId: string | undefined,
  programLevelId: string | undefined,
  academicSemesterId: string | undefined,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [
      RESULTS_KEY,
      "department-detail",
      departmentId,
      programLevelId,
      academicSemesterId,
    ],
    queryFn: () =>
      courseResultService.departmentGroupDetail(
        departmentId!,
        programLevelId!,
        academicSemesterId!,
      ),
    enabled:
      (options.enabled ?? true) &&
      !!departmentId &&
      !!programLevelId &&
      !!academicSemesterId,
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

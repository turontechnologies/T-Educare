import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  lectureAssignmentService,
  type CreateLectureAssignmentPayload,
  type CreateTimetableSlotPayload,
  type RequestTimetableChangePayload,
} from "@/services/lecture-assignment.service";

const ASSIGNMENTS_KEY = "lecture-assignments";
const CHANGE_REQUESTS_KEY = "timetable-change-requests";

export function useLectureAssignments(
  params: { lecturerId?: string } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [ASSIGNMENTS_KEY, params],
    queryFn: () =>
      lectureAssignmentService.list({ ...params, includeArchived: true }),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateAssignments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
}

export function useCreateLectureAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (payload: CreateLectureAssignmentPayload) =>
      lectureAssignmentService.create(payload),
    onSuccess: invalidate,
  });
}

export function useArchiveLectureAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (id: string) => lectureAssignmentService.archive(id),
    onSuccess: invalidate,
  });
}

export function useRestoreLectureAssignment() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: (id: string) => lectureAssignmentService.restore(id),
    onSuccess: invalidate,
  });
}

export function useAddTimetableSlot() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: ({
      assignmentId,
      payload,
    }: {
      assignmentId: string;
      payload: CreateTimetableSlotPayload;
    }) => lectureAssignmentService.addSlot(assignmentId, payload),
    onSuccess: invalidate,
  });
}

export function useRemoveTimetableSlot() {
  const invalidate = useInvalidateAssignments();
  return useMutation({
    mutationFn: ({
      assignmentId,
      slotId,
    }: {
      assignmentId: string;
      slotId: string;
    }) => lectureAssignmentService.removeSlot(assignmentId, slotId),
    onSuccess: invalidate,
  });
}

export function useTimetableChangeRequests(
  lecturerId?: string,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [CHANGE_REQUESTS_KEY, lecturerId ?? "all"],
    queryFn: () => lectureAssignmentService.listChangeRequests(lecturerId),
    staleTime: 15_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateChangeRequests() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: [CHANGE_REQUESTS_KEY] });
}

export function useRequestTimetableChange() {
  const invalidate = useInvalidateChangeRequests();
  return useMutation({
    mutationFn: (payload: RequestTimetableChangePayload) =>
      lectureAssignmentService.requestChange(payload),
    onSuccess: invalidate,
  });
}

export function useApproveTimetableChange() {
  const invalidate = useInvalidateAssignments();
  const invalidateRequests = useInvalidateChangeRequests();
  return useMutation({
    mutationFn: (id: string) => lectureAssignmentService.approveChange(id),
    onSuccess: () => {
      invalidate();
      invalidateRequests();
    },
  });
}

export function useRejectTimetableChange() {
  const invalidate = useInvalidateChangeRequests();
  return useMutation({
    mutationFn: (id: string) => lectureAssignmentService.rejectChange(id),
    onSuccess: invalidate,
  });
}

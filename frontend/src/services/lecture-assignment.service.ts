import { apiClient } from "@/lib/axios";
import type {
  DayOfWeek,
  LectureAssignment,
  TimetableChangeRequest,
  TimetableSlot,
} from "@/types/lecturer";

export type CreateLectureAssignmentPayload = {
  lecturerId: string;
  courseId: string;
  academicSessionId: string;
};

export type CreateTimetableSlotPayload = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  venue: string;
};

export type RequestTimetableChangePayload = {
  timetableSlotId: string;
  proposedDayOfWeek: DayOfWeek;
  proposedStartTime: string;
  proposedEndTime: string;
  proposedVenue?: string;
  reason: string;
};

export const lectureAssignmentService = {
  async list(
    params: { lecturerId?: string; includeArchived?: boolean } = {},
  ): Promise<LectureAssignment[]> {
    const { data } = await apiClient.get<LectureAssignment[]>(
      "/lecture-assignments",
      { params },
    );
    return data;
  },

  async create(
    payload: CreateLectureAssignmentPayload,
  ): Promise<LectureAssignment> {
    const { data } = await apiClient.post<LectureAssignment>(
      "/lecture-assignments",
      payload,
    );
    return data;
  },

  async archive(id: string): Promise<LectureAssignment> {
    const { data } = await apiClient.post<LectureAssignment>(
      `/lecture-assignments/${id}/archive`,
    );
    return data;
  },

  async restore(id: string): Promise<LectureAssignment> {
    const { data } = await apiClient.post<LectureAssignment>(
      `/lecture-assignments/${id}/restore`,
    );
    return data;
  },

  async addSlot(
    assignmentId: string,
    payload: CreateTimetableSlotPayload,
  ): Promise<TimetableSlot> {
    const { data } = await apiClient.post<TimetableSlot>(
      `/lecture-assignments/${assignmentId}/timetable-slots`,
      payload,
    );
    return data;
  },

  async removeSlot(assignmentId: string, slotId: string): Promise<void> {
    await apiClient.delete(
      `/lecture-assignments/${assignmentId}/timetable-slots/${slotId}`,
    );
  },

  async requestChange(
    payload: RequestTimetableChangePayload,
  ): Promise<TimetableChangeRequest> {
    const { data } = await apiClient.post<TimetableChangeRequest>(
      "/lecture-assignments/change-requests",
      payload,
    );
    return data;
  },

  async listChangeRequests(
    lecturerId?: string,
  ): Promise<TimetableChangeRequest[]> {
    const { data } = await apiClient.get<TimetableChangeRequest[]>(
      "/lecture-assignments/change-requests",
      { params: lecturerId ? { lecturerId } : undefined },
    );
    return data;
  },

  async approveChange(id: string): Promise<TimetableChangeRequest> {
    const { data } = await apiClient.post<TimetableChangeRequest>(
      `/lecture-assignments/change-requests/${id}/approve`,
    );
    return data;
  },

  async rejectChange(id: string): Promise<TimetableChangeRequest> {
    const { data } = await apiClient.post<TimetableChangeRequest>(
      `/lecture-assignments/change-requests/${id}/reject`,
    );
    return data;
  },
};

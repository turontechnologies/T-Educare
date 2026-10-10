package com.teducare.lecturer;

import java.time.Instant;
import java.util.List;

public record LectureAssignmentResponse(
        String id,
        String lecturerId,
        String courseId,
        String academicSessionId,
        Instant createdAt,
        Instant archivedAt,
        List<TimetableSlotResponse> timetableSlots) {

    static LectureAssignmentResponse from(LectureAssignment a, List<TimetableSlotResponse> slots) {
        return new LectureAssignmentResponse(
                a.getId(),
                a.getLecturerId(),
                a.getCourseId(),
                a.getAcademicSessionId(),
                a.getCreatedAt(),
                a.getArchivedAt(),
                slots);
    }
}

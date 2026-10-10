package com.teducare.lecturer;

import java.time.Instant;

public record TimetableSlotResponse(
        String id,
        String lectureAssignmentId,
        String dayOfWeek,
        String startTime,
        String endTime,
        String venue,
        Instant createdAt) {

    static TimetableSlotResponse from(TimetableSlot s) {
        return new TimetableSlotResponse(
                s.getId(),
                s.getLectureAssignmentId(),
                s.getDayOfWeek(),
                s.getStartTime(),
                s.getEndTime(),
                s.getVenue(),
                s.getCreatedAt());
    }
}

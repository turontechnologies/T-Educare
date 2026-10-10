package com.teducare.lecturer;

import java.time.Instant;

public record TimetableChangeRequestResponse(
        String id,
        String timetableSlotId,
        String requestedByLecturerId,
        String proposedDayOfWeek,
        String proposedStartTime,
        String proposedEndTime,
        String proposedVenue,
        String reason,
        String status,
        Instant createdAt,
        Instant resolvedAt) {

    static TimetableChangeRequestResponse from(TimetableChangeRequest r) {
        return new TimetableChangeRequestResponse(
                r.getId(),
                r.getTimetableSlotId(),
                r.getRequestedByLecturerId(),
                r.getProposedDayOfWeek(),
                r.getProposedStartTime(),
                r.getProposedEndTime(),
                r.getProposedVenue(),
                r.getReason(),
                r.getStatus(),
                r.getCreatedAt(),
                r.getResolvedAt());
    }
}

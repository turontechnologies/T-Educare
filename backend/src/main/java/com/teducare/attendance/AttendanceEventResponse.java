package com.teducare.attendance;

import java.time.Instant;

public record AttendanceEventResponse(
        String id,
        String staffId,
        String eventType,
        Instant occurredAt,
        String deviceId,
        String source,
        String note,
        Instant createdAt) {

    static AttendanceEventResponse from(AttendanceEvent event) {
        return new AttendanceEventResponse(
                event.getId(),
                event.getStaffId(),
                event.getEventType(),
                event.getOccurredAt(),
                event.getDeviceId(),
                event.getSource(),
                event.getNote(),
                event.getCreatedAt());
    }
}

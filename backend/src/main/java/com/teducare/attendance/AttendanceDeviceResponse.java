package com.teducare.attendance;

import java.time.Instant;

public record AttendanceDeviceResponse(
        String id,
        String name,
        String location,
        String status,
        Instant lastSeenAt,
        Instant createdAt,
        Instant revokedAt) {

    static AttendanceDeviceResponse from(AttendanceDevice device) {
        return new AttendanceDeviceResponse(
                device.getId(),
                device.getName(),
                device.getLocation(),
                device.getStatus(),
                device.getLastSeenAt(),
                device.getCreatedAt(),
                device.getRevokedAt());
    }
}

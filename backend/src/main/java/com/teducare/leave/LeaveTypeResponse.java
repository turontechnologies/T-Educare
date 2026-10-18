package com.teducare.leave;

import java.time.Instant;

public record LeaveTypeResponse(
        String id,
        String name,
        int defaultDaysPerYear,
        boolean rollover,
        Integer maxRolloverDays,
        Instant createdAt,
        Instant archivedAt) {

    static LeaveTypeResponse from(LeaveType type) {
        return new LeaveTypeResponse(
                type.getId(),
                type.getName(),
                type.getDefaultDaysPerYear(),
                type.isRollover(),
                type.getMaxRolloverDays(),
                type.getCreatedAt(),
                type.getArchivedAt());
    }
}

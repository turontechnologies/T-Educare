package com.teducare.staff;

import java.time.Instant;

public record StaffDisciplinaryRecordResponse(
        String id,
        String staffId,
        String actionType,
        String reason,
        Instant startDate,
        Instant endDate,
        String actorId,
        Instant createdAt) {

    static StaffDisciplinaryRecordResponse from(StaffDisciplinaryRecord record) {
        return new StaffDisciplinaryRecordResponse(
                record.getId(),
                record.getStaffId(),
                record.getActionType(),
                record.getReason(),
                record.getStartDate(),
                record.getEndDate(),
                record.getActorId(),
                record.getCreatedAt());
    }
}

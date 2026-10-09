package com.teducare.student;

import java.time.Instant;

public record StudentDisciplinaryRecordResponse(
        String id,
        String studentId,
        String actionType,
        String reason,
        Instant startDate,
        Instant endDate,
        String actorId,
        Instant createdAt) {

    static StudentDisciplinaryRecordResponse from(StudentDisciplinaryRecord record) {
        return new StudentDisciplinaryRecordResponse(
                record.getId(),
                record.getStudentId(),
                record.getActionType(),
                record.getReason(),
                record.getStartDate(),
                record.getEndDate(),
                record.getActorId(),
                record.getCreatedAt());
    }
}

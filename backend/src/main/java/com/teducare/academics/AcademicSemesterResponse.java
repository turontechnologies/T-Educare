package com.teducare.academics;

import java.time.Instant;

public record AcademicSemesterResponse(
        String id,
        String sessionId,
        String name,
        Integer semesterNumber,
        String description,
        Instant from,
        Instant to,
        String status,
        boolean isCurrent,
        Instant createdAt,
        Instant archivedAt) {

    static AcademicSemesterResponse from(AcademicSemester entity) {
        return new AcademicSemesterResponse(
                entity.getId(),
                entity.getSessionId(),
                entity.getName(),
                entity.getSemesterNumber(),
                entity.getDescription(),
                entity.getFrom(),
                entity.getTo(),
                entity.getStatus(),
                entity.isCurrent(),
                entity.getCreatedAt(),
                entity.getArchivedAt());
    }
}

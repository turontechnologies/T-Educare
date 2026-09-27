package com.teducare.academics;

import java.time.Instant;

public record AcademicSessionResponse(
        String id,
        String session,
        Instant from,
        Instant to,
        String status,
        boolean isCurrent,
        Instant createdAt,
        Instant archivedAt) {

    static AcademicSessionResponse from(AcademicSession entity) {
        return new AcademicSessionResponse(
                entity.getId(),
                entity.getSession(),
                entity.getFrom(),
                entity.getTo(),
                entity.getStatus(),
                entity.isCurrent(),
                entity.getCreatedAt(),
                entity.getArchivedAt());
    }
}

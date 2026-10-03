package com.teducare.programlevel;

import java.time.Instant;

public record ProgramLevelResponse(
        String id,
        String institutionId,
        String levelCode,
        String description,
        Instant createdAt,
        Instant archivedAt) {

    static ProgramLevelResponse from(ProgramLevel programLevel) {
        return new ProgramLevelResponse(
                programLevel.getId(),
                programLevel.getInstitutionId(),
                programLevel.getLevelCode(),
                programLevel.getDescription(),
                programLevel.getCreatedAt(),
                programLevel.getArchivedAt());
    }
}

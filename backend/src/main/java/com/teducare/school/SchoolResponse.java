package com.teducare.school;

import java.time.Instant;

public record SchoolResponse(
        String id,
        String institutionId,
        String name,
        String headName,
        String designation,
        Instant createdAt,
        Instant archivedAt) {

    static SchoolResponse from(School school) {
        return new SchoolResponse(
                school.getId(),
                school.getInstitutionId(),
                school.getName(),
                school.getHeadName(),
                school.getDesignation(),
                school.getCreatedAt(),
                school.getArchivedAt());
    }
}

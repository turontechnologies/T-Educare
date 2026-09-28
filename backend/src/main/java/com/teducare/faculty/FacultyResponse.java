package com.teducare.faculty;

import java.time.Instant;

public record FacultyResponse(
        String id,
        String institutionId,
        String name,
        String deanName,
        String schoolId,
        Instant createdAt,
        Instant archivedAt) {

    static FacultyResponse from(Faculty faculty) {
        return new FacultyResponse(
                faculty.getId(),
                faculty.getInstitutionId(),
                faculty.getName(),
                faculty.getDeanName(),
                faculty.getSchoolId(),
                faculty.getCreatedAt(),
                faculty.getArchivedAt());
    }
}

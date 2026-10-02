package com.teducare.program;

import java.time.Instant;

public record ProgramResponse(
        String id,
        String institutionId,
        String name,
        String departmentId,
        String facultyId,
        String programType,
        Instant createdAt,
        Instant archivedAt) {

    static ProgramResponse from(Program program) {
        return new ProgramResponse(
                program.getId(),
                program.getInstitutionId(),
                program.getName(),
                program.getDepartmentId(),
                program.getFacultyId(),
                program.getProgramType(),
                program.getCreatedAt(),
                program.getArchivedAt());
    }
}

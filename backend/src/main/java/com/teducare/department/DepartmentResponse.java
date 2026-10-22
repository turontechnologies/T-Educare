package com.teducare.department;

import java.time.Instant;

public record DepartmentResponse(
        String id,
        String institutionId,
        String name,
        String hodName,
        String hodSignatureUrl,
        String hodLecturerId,
        String facultyId,
        String schoolId,
        Instant createdAt,
        Instant archivedAt) {

    static DepartmentResponse from(Department department) {
        return new DepartmentResponse(
                department.getId(),
                department.getInstitutionId(),
                department.getName(),
                department.getHodName(),
                department.getHodSignatureUrl(),
                department.getHodLecturerId(),
                department.getFacultyId(),
                department.getSchoolId(),
                department.getCreatedAt(),
                department.getArchivedAt());
    }
}

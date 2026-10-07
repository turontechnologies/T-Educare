package com.teducare.course;

import java.time.Instant;

public record CourseResponse(
        String id,
        String institutionId,
        String name,
        String code,
        String departmentId,
        String schoolId,
        Instant createdAt,
        Instant archivedAt) {

    static CourseResponse from(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getInstitutionId(),
                course.getName(),
                course.getCode(),
                course.getDepartmentId(),
                course.getSchoolId(),
                course.getCreatedAt(),
                course.getArchivedAt());
    }
}

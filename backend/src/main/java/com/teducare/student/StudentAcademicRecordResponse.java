package com.teducare.student;

import java.time.Instant;
import java.util.List;

public record StudentAcademicRecordResponse(
        String id,
        String studentId,
        String academicSessionId,
        String programLevelId,
        String status,
        List<String> carryoverCourseIds,
        Instant createdAt) {

    static StudentAcademicRecordResponse from(StudentAcademicRecord record) {
        return new StudentAcademicRecordResponse(
                record.getId(),
                record.getStudentId(),
                record.getAcademicSessionId(),
                record.getProgramLevelId(),
                record.getStatus(),
                splitCourseIds(record.getCarryoverCourseIds()),
                record.getCreatedAt());
    }

    private static List<String> splitCourseIds(String csv) {
        return (csv == null || csv.isBlank()) ? List.of() : List.of(csv.split(","));
    }
}

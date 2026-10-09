package com.teducare.student;

import java.time.Instant;

public record StudentCaseRecordResponse(
        String id,
        String studentId,
        String title,
        String description,
        String status,
        String reportedBy,
        String resolutionNotes,
        Instant createdAt,
        Instant resolvedAt) {

    static StudentCaseRecordResponse from(StudentCaseRecord record) {
        return new StudentCaseRecordResponse(
                record.getId(),
                record.getStudentId(),
                record.getTitle(),
                record.getDescription(),
                record.getStatus(),
                record.getReportedBy(),
                record.getResolutionNotes(),
                record.getCreatedAt(),
                record.getResolvedAt());
    }
}

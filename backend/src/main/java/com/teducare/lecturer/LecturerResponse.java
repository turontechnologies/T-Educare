package com.teducare.lecturer;

import java.time.Instant;

public record LecturerResponse(
        String id,
        String username,
        String position,
        String assignmentType,
        String assignmentId,
        String gender,
        String firstName,
        String middleName,
        String lastName,
        String otherName,
        String email,
        String phone,
        Instant createdAt,
        Instant archivedAt) {

    static LecturerResponse from(Lecturer l) {
        return new LecturerResponse(
                l.getId(),
                l.getUsername(),
                l.getPosition(),
                l.getAssignmentType(),
                l.getAssignmentId(),
                l.getGender(),
                l.getFirstName(),
                l.getMiddleName(),
                l.getLastName(),
                l.getOtherName(),
                l.getEmail(),
                l.getPhone(),
                l.getCreatedAt(),
                l.getArchivedAt());
    }
}

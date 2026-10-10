package com.teducare.lecturer;

/** Any field left null keeps its current value — same partial-update convention as Role/Institution. */
public record UpdateLecturerRequest(
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
        String phone) {
}

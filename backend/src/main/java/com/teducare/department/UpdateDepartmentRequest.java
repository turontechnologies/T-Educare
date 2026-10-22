package com.teducare.department;

/**
 * Any field left null keeps its current value — same partial-update
 * convention as faculty/UpdateFacultyRequest. {@code hodSignatureUrl} is
 * the one exception: a non-null-but-blank value explicitly clears it
 * (removing the signature), rather than meaning "no change" — same
 * convention Courses already uses for unassigning {@code lecturerId}.
 */
public record UpdateDepartmentRequest(
        String name, String hodName, String hodSignatureUrl, String facultyId, String schoolId) {
}

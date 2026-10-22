package com.teducare.department;

/**
 * Any field left null keeps its current value — same partial-update
 * convention as faculty/UpdateFacultyRequest. {@code hodSignatureUrl}/
 * {@code hodLecturerId} are the exceptions: a non-null-but-blank value on
 * either explicitly clears it (removing the signature, or unlinking the
 * HOD), rather than meaning "no change" — same convention Courses already
 * uses for unassigning {@code lecturerId}.
 */
public record UpdateDepartmentRequest(
        String name, String hodName, String hodSignatureUrl, String hodLecturerId, String facultyId, String schoolId) {
}

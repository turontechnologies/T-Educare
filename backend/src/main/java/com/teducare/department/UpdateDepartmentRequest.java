package com.teducare.department;

/** Any field left null keeps its current value — same partial-update convention as faculty/UpdateFacultyRequest. */
public record UpdateDepartmentRequest(String name, String hodName, String facultyId, String schoolId) {
}

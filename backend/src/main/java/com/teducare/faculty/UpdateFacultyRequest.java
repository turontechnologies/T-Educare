package com.teducare.faculty;

/** Any field left null keeps its current value — same partial-update convention as school/UpdateSchoolRequest. */
public record UpdateFacultyRequest(String name, String deanName, String schoolId) {
}

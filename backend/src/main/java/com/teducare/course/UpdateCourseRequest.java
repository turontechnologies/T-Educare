package com.teducare.course;

/** Any field left null keeps its current value — same partial-update convention as program/UpdateProgramRequest. */
public record UpdateCourseRequest(String name, String code, String departmentId, String schoolId) {
}

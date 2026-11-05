package com.teducare.studentportal;

public record RegisteredCourseResponse(String courseId, String code, String name, int unit, boolean isCarryover) {
}

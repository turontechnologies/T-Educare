package com.teducare.registration;

import java.time.Instant;

public record CourseRegistrationResponse(
        String id,
        String studentId,
        String courseId,
        String academicSemesterId,
        int unitSnapshot,
        boolean isCarryover,
        Instant createdAt) {

    static CourseRegistrationResponse from(CourseRegistration registration) {
        return new CourseRegistrationResponse(
                registration.getId(),
                registration.getStudentId(),
                registration.getCourseId(),
                registration.getAcademicSemesterId(),
                registration.getUnitSnapshot(),
                registration.isCarryover(),
                registration.getCreatedAt());
    }
}

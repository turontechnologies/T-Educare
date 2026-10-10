package com.teducare.lecturer;

import jakarta.validation.constraints.NotBlank;

public record CreateLectureAssignmentRequest(
        @NotBlank(message = "Lecturer is required.") String lecturerId,
        @NotBlank(message = "Course is required.") String courseId,
        @NotBlank(message = "Academic session is required.") String academicSessionId) {
}

package com.teducare.registration;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record ReplaceCourseRegistrationsRequest(
        @NotBlank(message = "Student is required.") String studentId,
        @NotBlank(message = "Academic semester is required.") String academicSemesterId,
        @NotEmpty(message = "At least one course is required.") List<String> courseIds) {
}

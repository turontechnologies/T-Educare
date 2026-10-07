package com.teducare.course;

import jakarta.validation.constraints.NotBlank;

public record CreateCourseRequest(
        @NotBlank(message = "Name is required.") String name,
        @NotBlank(message = "Code is required.") String code,
        @NotBlank(message = "Department is required.") String departmentId,
        @NotBlank(message = "School is required.") String schoolId) {
}

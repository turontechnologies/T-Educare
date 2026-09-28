package com.teducare.faculty;

import jakarta.validation.constraints.NotBlank;

public record CreateFacultyRequest(
        @NotBlank(message = "Name is required.") String name,
        @NotBlank(message = "Dean name is required.") String deanName,
        @NotBlank(message = "School is required.") String schoolId) {
}

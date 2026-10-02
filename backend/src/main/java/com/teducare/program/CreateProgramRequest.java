package com.teducare.program;

import jakarta.validation.constraints.NotBlank;

public record CreateProgramRequest(
        @NotBlank(message = "Name is required.") String name,
        @NotBlank(message = "Department is required.") String departmentId,
        @NotBlank(message = "Faculty is required.") String facultyId,
        @NotBlank(message = "Program type is required.") String programType) {
}

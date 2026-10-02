package com.teducare.department;

import jakarta.validation.constraints.NotBlank;

public record CreateDepartmentRequest(
        @NotBlank(message = "Name is required.") String name,
        @NotBlank(message = "HOD name is required.") String hodName,
        @NotBlank(message = "Faculty is required.") String facultyId,
        @NotBlank(message = "School is required.") String schoolId) {
}

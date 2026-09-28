package com.teducare.school;

import jakarta.validation.constraints.NotBlank;

public record CreateSchoolRequest(
        @NotBlank(message = "Name is required.") String name,
        @NotBlank(message = "Head name is required.") String headName,
        @NotBlank(message = "Designation is required.") String designation) {
}

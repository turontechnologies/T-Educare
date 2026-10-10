package com.teducare.lecturer;

import jakarta.validation.constraints.NotBlank;

public record CreateLecturerRequest(
        @NotBlank(message = "Username is required.") String username,
        @NotBlank(message = "Position is required.") String position,
        @NotBlank(message = "Assignment type is required.") String assignmentType,
        @NotBlank(message = "Assignment is required.") String assignmentId,
        @NotBlank(message = "Gender is required.") String gender,
        @NotBlank(message = "First name is required.") String firstName,
        String middleName,
        @NotBlank(message = "Last name is required.") String lastName,
        String otherName,
        @NotBlank(message = "Email is required.") String email,
        @NotBlank(message = "Phone is required.") String phone) {
}

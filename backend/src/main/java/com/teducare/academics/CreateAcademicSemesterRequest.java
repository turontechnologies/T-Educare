package com.teducare.academics;

import java.time.Instant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAcademicSemesterRequest(
        @NotBlank(message = "Session is required.") String sessionId,
        @NotBlank(message = "Name is required.") String name,
        @NotNull(message = "Semester number is required.") @Min(value = 1, message = "Semester number must be 1 or 2.")
        @Max(value = 2, message = "Semester number must be 1 or 2.") Integer semesterNumber,
        String description,
        @NotNull(message = "Start date is required.") Instant from,
        @NotNull(message = "End date is required.") Instant to,
        String status) {
}

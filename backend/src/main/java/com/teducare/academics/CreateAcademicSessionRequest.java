package com.teducare.academics;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAcademicSessionRequest(
        @NotBlank(message = "Session is required.") String session,
        @NotNull(message = "Start date is required.") Instant from,
        @NotNull(message = "End date is required.") Instant to,
        String status) {
}

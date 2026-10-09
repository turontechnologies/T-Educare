package com.teducare.student;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;

public record RecordDisciplinaryActionRequest(
        @NotBlank(message = "Action type is required.") String actionType,
        @NotBlank(message = "Reason is required.") String reason,
        Instant startDate,
        Instant endDate) {
}

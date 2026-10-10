package com.teducare.staff;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;

public record RecordStaffDisciplinaryActionRequest(
        @NotBlank(message = "Action type is required.") String actionType,
        @NotBlank(message = "Reason is required.") String reason,
        Instant startDate,
        Instant endDate) {
}

package com.teducare.registration;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateRegistrationSettingsRequest(
        @NotNull(message = "requireCarryoverClearance is required.") Boolean requireCarryoverClearance,
        @NotNull(message = "maxUnitsPerSemester is required.")
        @Min(value = 1, message = "maxUnitsPerSemester must be at least 1.") Integer maxUnitsPerSemester) {
}

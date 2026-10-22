package com.teducare.registration;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * {@code registrationOpensAt}/{@code registrationClosesAt}/
 * {@code registrationGracePeriodEndsAt} are all optional ISO-8601 instant
 * strings — omitted or blank clears that field (no window/grace period
 * set, meaning unrestricted), matching the "a blank field is meaningful,
 * not just a missing one" convention already used for {@code lecturerId}
 * on Courses.
 */
public record UpdateRegistrationSettingsRequest(
        @NotNull(message = "requireCarryoverClearance is required.") Boolean requireCarryoverClearance,
        @NotNull(message = "maxUnitsPerSemester is required.")
        @Min(value = 1, message = "maxUnitsPerSemester must be at least 1.") Integer maxUnitsPerSemester,
        String registrationOpensAt,
        String registrationClosesAt,
        String registrationGracePeriodEndsAt) {
}

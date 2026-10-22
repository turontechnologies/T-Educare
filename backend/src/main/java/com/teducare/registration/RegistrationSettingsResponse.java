package com.teducare.registration;

import java.time.Instant;

public record RegistrationSettingsResponse(
        boolean requireCarryoverClearance,
        int maxUnitsPerSemester,
        Instant registrationOpensAt,
        Instant registrationClosesAt) {
}

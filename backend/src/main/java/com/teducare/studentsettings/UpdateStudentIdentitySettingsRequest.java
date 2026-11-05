package com.teducare.studentsettings;

import jakarta.validation.constraints.NotBlank;

public record UpdateStudentIdentitySettingsRequest(
        @NotBlank(message = "preStudentIdentifierPreference is required.") String preStudentIdentifierPreference,
        /** Optional — blank/omitted leaves the currently-configured default password unchanged. Plaintext in transit only; stored as a BCrypt hash, never returned. */
        String defaultPassword) {
}

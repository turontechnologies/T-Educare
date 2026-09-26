package com.teducare.institution;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;

/**
 * expiringAt is conditionally required (unless licenseType is "Basic") —
 * enforced in the service, not via bean validation, since the rule depends
 * on another field's value (API_CONTRACT.md §4.7.1).
 */
public record LicenseRequest(
        @NotBlank(message = "licenseType is required.") String licenseType,
        Instant expiringAt,
        @NotBlank(message = "License key is required.") String licenseKey) {
}

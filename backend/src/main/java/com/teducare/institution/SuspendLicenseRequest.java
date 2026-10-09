package com.teducare.institution;

import jakarta.validation.constraints.NotBlank;

public record SuspendLicenseRequest(
        @NotBlank(message = "Reason is required.") String reason) {
}

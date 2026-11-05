package com.teducare.finance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PaystackSettingsRequest(
        @NotBlank(message = "Public key is required.") String publicKey,
        @NotBlank(message = "Secret key is required.") String secretKey,
        @NotNull(message = "Enabled is required.") Boolean enabled) {
}

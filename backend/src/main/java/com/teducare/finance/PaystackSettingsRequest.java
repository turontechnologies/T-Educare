package com.teducare.finance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** {@code secretKey} may be blank on an update — that means "keep the current one" (see {@code FinanceService#updatePaystackSettings}); it's required only the first time, when no settings row exists yet. */
public record PaystackSettingsRequest(
        @NotBlank(message = "Public key is required.") String publicKey,
        String secretKey,
        @NotNull(message = "Enabled is required.") Boolean enabled) {
}

package com.teducare.finance;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record PaystackLinkRequest(
        @NotNull(message = "Amount is required.") @DecimalMin(value = "0.01", message = "Amount must be greater than 0.")
        BigDecimal amount) {
}

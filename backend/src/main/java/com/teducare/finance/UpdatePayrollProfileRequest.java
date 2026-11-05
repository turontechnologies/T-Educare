package com.teducare.finance;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;

public record UpdatePayrollProfileRequest(
        @NotNull(message = "Allowances is required.") BigDecimal allowances,
        @NotNull(message = "Deductions is required.") BigDecimal deductions,
        @NotNull(message = "On hold is required.") Boolean onHold,
        String onHoldReason) {
}

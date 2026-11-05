package com.teducare.finance;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RunPayrollRequest(
        @NotNull(message = "Period year is required.") Integer periodYear,
        @NotNull(message = "Period month is required.") @Min(value = 1, message = "Period month must be 1-12.")
        @Max(value = 12, message = "Period month must be 1-12.") Integer periodMonth) {
}

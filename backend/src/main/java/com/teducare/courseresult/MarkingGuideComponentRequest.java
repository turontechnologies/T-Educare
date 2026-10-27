package com.teducare.courseresult;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MarkingGuideComponentRequest(
        @NotBlank(message = "Component name is required.") String name,
        @NotNull(message = "Weight is required.") @DecimalMin(value = "0.01", message = "Weight must be greater than 0.")
        BigDecimal weight) {
}

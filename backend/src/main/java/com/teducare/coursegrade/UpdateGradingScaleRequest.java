package com.teducare.coursegrade;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;

public record UpdateGradingScaleRequest(@NotNull(message = "Max grade point is required.") BigDecimal maxGradePoint) {
}

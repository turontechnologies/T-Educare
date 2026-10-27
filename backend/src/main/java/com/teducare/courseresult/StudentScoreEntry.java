package com.teducare.courseresult;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StudentScoreEntry(
        @NotBlank(message = "studentId is required.") String studentId,
        @NotNull(message = "score is required.")
        @DecimalMin(value = "0", message = "score must be at least 0.")
        @DecimalMax(value = "1000", message = "score is too large.") BigDecimal score) {
}

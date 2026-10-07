package com.teducare.coursegrade;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCourseGradeRequest(
        @NotBlank(message = "Code is required.") String code,
        @NotBlank(message = "Remark is required.") String remark,
        @NotNull(message = "Grade score is required.") BigDecimal gradeScore,
        @NotNull(message = "Minimum score is required.") BigDecimal minimumScore,
        @NotNull(message = "Maximum score is required.") BigDecimal maximumScore) {
}

package com.teducare.courseresult;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCourseResultRequest(
        @NotBlank(message = "studentId is required.") String studentId,
        @NotBlank(message = "courseId is required.") String courseId,
        @NotBlank(message = "academicSemesterId is required.") String academicSemesterId,
        @NotNull(message = "score is required.")
        @DecimalMin(value = "0", message = "score must be at least 0.")
        @DecimalMax(value = "100", message = "score must be at most 100.") BigDecimal score) {
}

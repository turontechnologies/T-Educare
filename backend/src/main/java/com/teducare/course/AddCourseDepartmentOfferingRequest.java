package com.teducare.course;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record AddCourseDepartmentOfferingRequest(
        @NotBlank(message = "Department is required.") String departmentId,
        /** Null uses the course's own base unit. */
        @Min(value = 1, message = "Unit override must be at least 1.")
        @Max(value = 10, message = "Unit override must be at most 10.") Integer unitOverride,
        boolean compulsory) {
}

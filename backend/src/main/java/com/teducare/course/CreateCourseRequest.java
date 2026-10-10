package com.teducare.course;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateCourseRequest(
        @NotBlank(message = "Name is required.") String name,
        @NotBlank(message = "Code is required.") String code,
        @NotBlank(message = "Department is required.") String departmentId,
        @NotBlank(message = "School is required.") String schoolId,
        @NotBlank(message = "Program level is required.") String programLevelId,
        @NotNull(message = "Unit is required.") @Min(value = 1, message = "Unit must be at least 1.")
        @Max(value = 10, message = "Unit must be at most 10.") Integer unit,
        @NotNull(message = "Semester number is required.") @Min(value = 1, message = "Semester number must be 1 or 2.")
        @Max(value = 2, message = "Semester number must be 1 or 2.") Integer semesterNumber,
        /** Nullable — a course doesn't require a lecturer assigned up front. */
        String lecturerId) {
}

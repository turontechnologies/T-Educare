package com.teducare.student;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record AddAcademicRecordRequest(
        @NotBlank(message = "Academic session is required.") String academicSessionId,
        @NotBlank(message = "Program level is required.") String programLevelId,
        @NotBlank(message = "Status is required.") String status,
        List<String> carryoverCourseIds) {
}

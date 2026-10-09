package com.teducare.student;

import jakarta.validation.constraints.NotBlank;

public record ReportCaseRequest(
        @NotBlank(message = "Title is required.") String title,
        @NotBlank(message = "Description is required.") String description) {
}

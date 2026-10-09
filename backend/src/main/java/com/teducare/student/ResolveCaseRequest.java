package com.teducare.student;

import jakarta.validation.constraints.NotBlank;

public record ResolveCaseRequest(
        @NotBlank(message = "Status is required.") String status,
        String resolutionNotes) {
}

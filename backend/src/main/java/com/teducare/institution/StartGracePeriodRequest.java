package com.teducare.institution;

import jakarta.validation.constraints.NotBlank;

public record StartGracePeriodRequest(
        @NotBlank(message = "Reason is required.") String reason,
        Integer graceDays) {
}

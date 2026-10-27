package com.teducare.courseresult;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateGracePeriodRequest(
        @NotBlank(message = "Deadline date is required.") String deadlineDate,
        @NotNull(message = "Grace period is required.") @Min(value = 0, message = "Grace period can't be negative.")
        Integer gracePeriodDays) {
}

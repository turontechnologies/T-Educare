package com.teducare.courseresult;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

/** Full replace — components must sum to exactly 100 (validated by {@code MarkingGuideService}), matching the dialog's own live "Total X/100" indicator. */
public record UpdateMarkingGuideRequest(
        @NotBlank(message = "Guide name is required.") String name,
        @NotEmpty(message = "At least one component is required.") @Valid List<MarkingGuideComponentRequest> components) {
}

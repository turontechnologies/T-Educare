package com.teducare.courseresult;

import jakarta.validation.constraints.NotBlank;

public record UnpublishRequest(@NotBlank(message = "A reason is required.") String reason) {
}

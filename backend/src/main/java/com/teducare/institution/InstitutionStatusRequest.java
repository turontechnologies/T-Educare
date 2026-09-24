package com.teducare.institution;

import jakarta.validation.constraints.NotBlank;

public record InstitutionStatusRequest(
        @NotBlank(message = "Status is required.") String status) {
}

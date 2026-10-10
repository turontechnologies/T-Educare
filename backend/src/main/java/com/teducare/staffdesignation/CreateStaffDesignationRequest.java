package com.teducare.staffdesignation;

import jakarta.validation.constraints.NotBlank;

public record CreateStaffDesignationRequest(
        @NotBlank(message = "Name is required.") String name,
        String description,
        @NotBlank(message = "Category is required.") String category) {
}

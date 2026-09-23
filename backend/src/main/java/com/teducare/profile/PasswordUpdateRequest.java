package com.teducare.profile;

import jakarta.validation.constraints.NotBlank;

public record PasswordUpdateRequest(
        @NotBlank(message = "Current password is required.") String currentPassword,
        @NotBlank(message = "New password is required.") String newPassword) {
}

package com.teducare.usermanager;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateUserManagerRequest(
        @NotBlank(message = "First name is required.") String firstName,
        String otherName,
        @NotBlank(message = "Last name is required.") String lastName,
        String gender,
        @NotBlank(message = "Email is required.") @Email(message = "Enter a valid email address.") String email,
        String phone,
        @NotBlank(message = "Username is required.") String username,
        @NotBlank(message = "Password is required.") String password,
        @NotBlank(message = "Institution is required.") String institutionId,
        boolean isPrimaryAdmin,
        String avatarUrl) {
}

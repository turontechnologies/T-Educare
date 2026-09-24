package com.teducare.profile;

import jakarta.validation.constraints.Email;

public record ProfileUpdateRequest(
        String firstName,
        String lastName,
        @Email(message = "Enter a valid email address.") String email,
        String phone,
        String avatarUrl) {
}

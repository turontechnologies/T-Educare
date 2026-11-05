package com.teducare.studentauth;

import jakarta.validation.constraints.NotBlank;

public record StudentLoginRequest(
        @NotBlank(message = "Enter your matric number") String matricNo,
        @NotBlank(message = "Enter your password") String password,
        /** Optional — present when logging in from an institution-scoped URL (`/{slug}/login` on the Student Portal). When set, the matched student must belong to that exact institution, same cross-tenant guard as the admin app's AuthService.login. */
        String institutionSlug) {
}

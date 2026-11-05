package com.teducare.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Enter your username") String username,
        @NotBlank(message = "Enter your password") String password,
        /** Optional — present when logging in from an institution-scoped URL (`/login/{slug}`). When set, the caller's account must belong to that exact institution; a super_admin account (institutionId null) is exempt, since the platform console itself has no single tenant. */
        String institutionSlug) {
}

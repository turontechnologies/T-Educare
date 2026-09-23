package com.teducare.auth;

public record LoginResponse(AuthenticatedUserDto user, String token) {
}

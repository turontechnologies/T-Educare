package com.teducare.studentauth;

public record StudentLoginResponse(StudentAuthProfileResponse student, String token) {
}

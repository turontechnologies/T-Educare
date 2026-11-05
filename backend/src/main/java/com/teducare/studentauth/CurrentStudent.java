package com.teducare.studentauth;

/** Resolved from the JWT's own claims (see JwtAuthenticationFilter), not from AuthDirectory — a Student has no UserAccount row. */
public record CurrentStudent(String studentId, String institutionId) {
}

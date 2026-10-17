package com.teducare.attendance;

/** Returned exactly once, at creation — the plaintext apiKey is never retrievable again, same convention as a generated password. */
public record AttendanceDeviceCreatedResponse(AttendanceDeviceResponse device, String apiKey) {
}

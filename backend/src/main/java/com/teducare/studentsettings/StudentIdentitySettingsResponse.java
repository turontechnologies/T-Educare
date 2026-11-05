package com.teducare.studentsettings;

/** {@code hasDefaultPassword} only ever signals whether one is configured — the hash itself is never returned, same convention as PaystackSettingsResponse's hasSecretKey. */
public record StudentIdentitySettingsResponse(
        String preStudentIdentifierPreference, boolean hasDefaultPassword) {
}

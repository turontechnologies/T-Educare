package com.teducare.finance;

/** {@code secretKey} is never included — super admin only ever sees whether one is configured ({@code hasSecretKey}), never its value, once set. */
public record PaystackSettingsResponse(
        String institutionId, String publicKey, boolean hasSecretKey, boolean enabled) {

    static PaystackSettingsResponse from(PaystackSettings settings) {
        if (settings == null) {
            return new PaystackSettingsResponse(null, null, false, false);
        }
        return new PaystackSettingsResponse(
                settings.getInstitutionId(), settings.getPublicKey(), true, settings.isEnabled());
    }
}

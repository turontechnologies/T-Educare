package com.teducare.institution;

/** Any field left null keeps its current value — same partial-update convention as profile/ProfileUpdateRequest. */
public record UpdateInstitutionRequest(
        String name,
        String institutionType,
        String address,
        String city,
        String countryState,
        String principalName,
        String principalEmail,
        String principalPhone,
        String adminUser,
        String adminEmail,
        String logoUrl) {
}

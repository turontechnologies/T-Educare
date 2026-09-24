package com.teducare.institution;

import jakarta.validation.constraints.NotBlank;

public record CreateInstitutionRequest(
        @NotBlank(message = "Institution name is required.") String name,
        @NotBlank(message = "Institution type is required.") String institutionType,
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

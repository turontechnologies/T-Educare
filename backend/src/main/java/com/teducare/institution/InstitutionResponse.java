package com.teducare.institution;

import java.time.Instant;
import java.util.List;

public record InstitutionResponse(
        String id,
        String code,
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
        String logoUrl,
        List<String> moduleKeys,
        Instant modulesLastEditedAt,
        int modulesCount,
        int studentCount,
        long revenue,
        String licenseType,
        Instant expiringAt,
        String tokenKey,
        String licenseKey,
        Instant licenseIssuedAt,
        String status,
        Instant createdAt,
        Instant archivedAt) {

    static InstitutionResponse from(Institution institution) {
        return new InstitutionResponse(
                institution.getId(),
                institution.getCode(),
                institution.getName(),
                institution.getInstitutionType(),
                institution.getAddress(),
                institution.getCity(),
                institution.getCountryState(),
                institution.getPrincipalName(),
                institution.getPrincipalEmail(),
                institution.getPrincipalPhone(),
                institution.getAdminUser(),
                institution.getAdminEmail(),
                institution.getLogoUrl(),
                splitModuleKeys(institution.getModuleKeys()),
                institution.getModulesLastEditedAt(),
                institution.getModulesCount(),
                institution.getStudentCount(),
                institution.getRevenue(),
                institution.getLicenseType(),
                institution.getExpiringAt(),
                institution.getTokenKey(),
                institution.getLicenseKey(),
                institution.getLicenseIssuedAt(),
                institution.getStatus(),
                institution.getCreatedAt(),
                institution.getArchivedAt());
    }

    private static List<String> splitModuleKeys(String moduleKeys) {
        return (moduleKeys == null || moduleKeys.isBlank())
                ? List.of()
                : List.of(moduleKeys.split(","));
    }
}

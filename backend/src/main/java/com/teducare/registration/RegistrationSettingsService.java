package com.teducare.registration;

import org.springframework.stereotype.Service;

@Service
public class RegistrationSettingsService {

    /** Matches the user's explicit description: a carryover course must be registered before a new one, by default — an institution can turn this off. */
    private static final boolean DEFAULT_REQUIRE_CARRYOVER_CLEARANCE = true;

    /** A reasonable real-world default for a full-time semester course load. */
    private static final int DEFAULT_MAX_UNITS_PER_SEMESTER = 24;

    private final RegistrationSettingsRepository repository;

    public RegistrationSettingsService(RegistrationSettingsRepository repository) {
        this.repository = repository;
    }

    public RegistrationSettingsResponse get(String institutionId) {
        return repository.findById(institutionId)
                .map(settings -> new RegistrationSettingsResponse(
                        settings.isRequireCarryoverClearance(), settings.getMaxUnitsPerSemester()))
                .orElse(new RegistrationSettingsResponse(
                        DEFAULT_REQUIRE_CARRYOVER_CLEARANCE, DEFAULT_MAX_UNITS_PER_SEMESTER));
    }

    public RegistrationSettingsResponse update(String institutionId, UpdateRegistrationSettingsRequest request) {
        RegistrationSettings settings = repository.findById(institutionId)
                .orElse(new RegistrationSettings(
                        institutionId, request.requireCarryoverClearance(), request.maxUnitsPerSemester()));
        settings.setRequireCarryoverClearance(request.requireCarryoverClearance());
        settings.setMaxUnitsPerSemester(request.maxUnitsPerSemester());
        repository.save(settings);
        return new RegistrationSettingsResponse(
                settings.isRequireCarryoverClearance(), settings.getMaxUnitsPerSemester());
    }
}

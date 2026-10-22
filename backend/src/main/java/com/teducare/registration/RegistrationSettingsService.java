package com.teducare.registration;

import java.time.Instant;
import java.time.format.DateTimeParseException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
                .map(RegistrationSettingsService::toResponse)
                .orElse(new RegistrationSettingsResponse(
                        DEFAULT_REQUIRE_CARRYOVER_CLEARANCE, DEFAULT_MAX_UNITS_PER_SEMESTER, null, null, null));
    }

    public RegistrationSettingsResponse update(String institutionId, UpdateRegistrationSettingsRequest request) {
        RegistrationSettings settings = repository.findById(institutionId)
                .orElse(new RegistrationSettings(
                        institutionId, request.requireCarryoverClearance(), request.maxUnitsPerSemester()));
        settings.setRequireCarryoverClearance(request.requireCarryoverClearance());
        settings.setMaxUnitsPerSemester(request.maxUnitsPerSemester());
        settings.setRegistrationOpensAt(parseOrNull(request.registrationOpensAt(), "registrationOpensAt"));
        settings.setRegistrationClosesAt(parseOrNull(request.registrationClosesAt(), "registrationClosesAt"));
        settings.setRegistrationGracePeriodEndsAt(
                parseOrNull(request.registrationGracePeriodEndsAt(), "registrationGracePeriodEndsAt"));
        repository.save(settings);
        return toResponse(settings);
    }

    /**
     * Whether a registration action is allowed right now — unrestricted if
     * no window has ever been set (null {@code opensAt}/{@code closesAt}),
     * open within [{@code opensAt}, {@code closesAt}], or still open through
     * {@code gracePeriodEndsAt} if the admin has extended one past the
     * official close. Centralized here, not duplicated in
     * {@code CourseRegistrationService}, so the slip-printing/admin-override
     * paths can reuse the exact same rule later without redefining it.
     */
    public void requireRegistrationOpen(String institutionId) {
        RegistrationSettings settings = repository.findById(institutionId).orElse(null);
        if (settings == null) {
            return;
        }
        Instant now = Instant.now();
        if (settings.getRegistrationOpensAt() != null && now.isBefore(settings.getRegistrationOpensAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Course registration has not opened yet. It opens " + settings.getRegistrationOpensAt() + ".");
        }
        Instant closesAt = settings.getRegistrationClosesAt();
        if (closesAt == null || !now.isAfter(closesAt)) {
            return;
        }
        Instant graceEndsAt = settings.getRegistrationGracePeriodEndsAt();
        if (graceEndsAt != null && !now.isAfter(graceEndsAt)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Course registration closed " + closesAt + ". Contact your institution to request a grace period.");
    }

    private static RegistrationSettingsResponse toResponse(RegistrationSettings settings) {
        return new RegistrationSettingsResponse(
                settings.isRequireCarryoverClearance(),
                settings.getMaxUnitsPerSemester(),
                settings.getRegistrationOpensAt(),
                settings.getRegistrationClosesAt(),
                settings.getRegistrationGracePeriodEndsAt());
    }

    private static Instant parseOrNull(String value, String field) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " must be a valid ISO-8601 instant.");
        }
    }
}

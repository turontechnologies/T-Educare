package com.teducare.studentsettings;

import java.util.Optional;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudentIdentitySettingsService {

    private static final Set<String> PREFERENCES = Set.of("PRE_ADMISSION_ID", "JAMB_REG_NUMBER");

    /** Matches the system's own guaranteed-always-present identifier — the safest default since it never requires data entry. */
    private static final String DEFAULT_PREFERENCE = "PRE_ADMISSION_ID";

    private final StudentIdentitySettingsRepository repository;
    private final PasswordEncoder passwordEncoder;

    public StudentIdentitySettingsService(StudentIdentitySettingsRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public StudentIdentitySettingsResponse get(String institutionId) {
        return repository.findById(institutionId)
                .map(settings -> new StudentIdentitySettingsResponse(
                        settings.getPreStudentIdentifierPreference(), settings.getDefaultPasswordHash() != null))
                .orElse(new StudentIdentitySettingsResponse(DEFAULT_PREFERENCE, false));
    }

    public StudentIdentitySettingsResponse update(String institutionId, UpdateStudentIdentitySettingsRequest request) {
        if (!PREFERENCES.contains(request.preStudentIdentifierPreference())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "preStudentIdentifierPreference must be PRE_ADMISSION_ID or JAMB_REG_NUMBER.");
        }

        StudentIdentitySettings settings = repository.findById(institutionId)
                .orElse(new StudentIdentitySettings(institutionId, request.preStudentIdentifierPreference()));
        settings.setPreStudentIdentifierPreference(request.preStudentIdentifierPreference());
        if (request.defaultPassword() != null && !request.defaultPassword().isBlank()) {
            if (request.defaultPassword().trim().length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Default password must be at least 6 characters.");
            }
            settings.setDefaultPasswordHash(passwordEncoder.encode(request.defaultPassword().trim()));
        }
        repository.save(settings);
        return new StudentIdentitySettingsResponse(
                settings.getPreStudentIdentifierPreference(), settings.getDefaultPasswordHash() != null);
    }

    /** Used only by {@code StudentService#resetPasswordToDefault} — never exposed over the API. */
    public Optional<String> getDefaultPasswordHash(String institutionId) {
        return repository.findById(institutionId).map(StudentIdentitySettings::getDefaultPasswordHash);
    }
}

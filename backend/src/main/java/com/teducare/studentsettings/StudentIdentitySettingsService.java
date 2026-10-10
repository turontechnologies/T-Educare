package com.teducare.studentsettings;

import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudentIdentitySettingsService {

    private static final Set<String> PREFERENCES = Set.of("PRE_ADMISSION_ID", "JAMB_REG_NUMBER");

    /** Matches the system's own guaranteed-always-present identifier — the safest default since it never requires data entry. */
    private static final String DEFAULT_PREFERENCE = "PRE_ADMISSION_ID";

    private final StudentIdentitySettingsRepository repository;

    public StudentIdentitySettingsService(StudentIdentitySettingsRepository repository) {
        this.repository = repository;
    }

    public StudentIdentitySettingsResponse get(String institutionId) {
        return repository.findById(institutionId)
                .map(settings -> new StudentIdentitySettingsResponse(settings.getPreStudentIdentifierPreference()))
                .orElse(new StudentIdentitySettingsResponse(DEFAULT_PREFERENCE));
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
        repository.save(settings);
        return new StudentIdentitySettingsResponse(settings.getPreStudentIdentifierPreference());
    }
}

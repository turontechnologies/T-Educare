package com.teducare.studentsettings;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/** Institution-scoped student-identity display policy (API_CONTRACT.md §7.14) — always "my own institution's setting", resolved from the caller. */
@RestController
@RequestMapping("/api/student-identity-settings")
public class StudentIdentitySettingsController {

    private final StudentIdentitySettingsService service;
    private final AuthDirectory authDirectory;

    public StudentIdentitySettingsController(StudentIdentitySettingsService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public StudentIdentitySettingsResponse get(Authentication authentication) {
        return service.get(requireInstitutionId(authentication));
    }

    @PutMapping
    public StudentIdentitySettingsResponse update(
            Authentication authentication, @Valid @RequestBody UpdateStudentIdentitySettingsRequest request) {
        return service.update(requireInstitutionId(authentication), request);
    }

    private String requireInstitutionId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        AuthenticatedUserDto caller = authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));

        if (!"institution_admin".equals(caller.role()) || caller.institutionId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Institution admin access required.");
        }
        return caller.institutionId();
    }
}

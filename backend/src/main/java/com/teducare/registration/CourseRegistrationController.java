package com.teducare.registration;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/** Institution-scoped Course Registration (API_CONTRACT.md §7.12) — always "my own institution's registrations", resolved from the caller. */
@RestController
@RequestMapping("/api/course-registrations")
public class CourseRegistrationController {

    private final CourseRegistrationService service;
    private final AuthDirectory authDirectory;

    public CourseRegistrationController(CourseRegistrationService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<CourseRegistrationResponse> list(
            Authentication authentication,
            @RequestParam String studentId,
            @RequestParam String academicSemesterId) {
        return service.list(requireInstitutionId(authentication), studentId, academicSemesterId);
    }

    /** Full replace, not additive — same convention as `linkModules`/`GradingScale`'s own PUT. */
    @PutMapping
    public List<CourseRegistrationResponse> replace(
            Authentication authentication, @Valid @RequestBody ReplaceCourseRegistrationsRequest request) {
        return service.replace(requireInstitutionId(authentication), request);
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

package com.teducare.academics;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/** Institution-scoped Academic Semesters (API_CONTRACT.md §7/§7.1) — always "my own institution's semesters", resolved from the caller. */
@RestController
@RequestMapping("/api/academic-semesters")
public class AcademicSemesterController {

    private final AcademicSemesterService service;
    private final AuthDirectory authDirectory;

    public AcademicSemesterController(AcademicSemesterService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<AcademicSemesterResponse> list(
            Authentication authentication, @RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.list(requireInstitutionId(authentication), includeArchived);
    }

    @PostMapping
    public ResponseEntity<AcademicSemesterResponse> create(
            Authentication authentication, @Valid @RequestBody CreateAcademicSemesterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(requireInstitutionId(authentication), request));
    }

    @PatchMapping("/{id}")
    public AcademicSemesterResponse update(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody UpdateAcademicSemesterRequest request) {
        return service.update(requireInstitutionId(authentication), id, request);
    }

    @PostMapping("/{id}/archive")
    public AcademicSemesterResponse archive(Authentication authentication, @PathVariable String id) {
        return service.archive(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/restore")
    public AcademicSemesterResponse restore(Authentication authentication, @PathVariable String id) {
        return service.restore(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/set-current")
    public AcademicSemesterResponse setCurrent(Authentication authentication, @PathVariable String id) {
        return service.setCurrent(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/close")
    public AcademicSemesterResponse close(Authentication authentication, @PathVariable String id) {
        return service.close(requireInstitutionId(authentication), id);
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

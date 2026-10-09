package com.teducare.student;

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

/** Institution-scoped Students (API_CONTRACT.md §7.13) — always "my own institution's students", resolved from the caller. */
@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService service;
    private final AuthDirectory authDirectory;

    public StudentController(StudentService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<StudentResponse> list(
            Authentication authentication,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String schoolId,
            @RequestParam(required = false) String facultyId,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String programId,
            @RequestParam(required = false) String programLevelId,
            @RequestParam(required = false) String currentSessionId,
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.list(
                requireInstitutionId(authentication),
                search,
                schoolId,
                facultyId,
                departmentId,
                programId,
                programLevelId,
                currentSessionId,
                includeArchived);
    }

    @GetMapping("/{id}")
    public StudentResponse get(Authentication authentication, @PathVariable String id) {
        return service.get(requireInstitutionId(authentication), id);
    }

    @PostMapping
    public ResponseEntity<StudentResponse> create(
            Authentication authentication, @Valid @RequestBody CreateStudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(requireInstitutionId(authentication), request));
    }

    @PatchMapping("/{id}")
    public StudentResponse update(
            Authentication authentication, @PathVariable String id, @RequestBody UpdateStudentRequest request) {
        return service.update(requireInstitutionId(authentication), id, request);
    }

    @PostMapping("/{id}/archive")
    public StudentResponse archive(Authentication authentication, @PathVariable String id) {
        return service.archive(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/restore")
    public StudentResponse restore(Authentication authentication, @PathVariable String id) {
        return service.restore(requireInstitutionId(authentication), id);
    }

    @GetMapping("/{id}/academic-history")
    public List<StudentAcademicRecordResponse> academicHistory(Authentication authentication, @PathVariable String id) {
        return service.listAcademicHistory(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/academic-history")
    public StudentAcademicRecordResponse addAcademicRecord(
            Authentication authentication, @PathVariable String id, @Valid @RequestBody AddAcademicRecordRequest request) {
        return service.addAcademicRecord(requireInstitutionId(authentication), id, request);
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

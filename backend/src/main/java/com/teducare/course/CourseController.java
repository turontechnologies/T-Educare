package com.teducare.course;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/** Institution-scoped Courses (API_CONTRACT.md §7.10) — always "my own institution's courses", resolved from the caller. */
@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService service;
    private final AuthDirectory authDirectory;

    public CourseController(CourseService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<CourseResponse> list(
            Authentication authentication,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.list(requireInstitutionId(authentication), departmentId, schoolId, search, includeArchived);
    }

    @PostMapping
    public ResponseEntity<CourseResponse> create(
            Authentication authentication, @Valid @RequestBody CreateCourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(requireInstitutionId(authentication), request));
    }

    @PatchMapping("/{id}")
    public CourseResponse update(
            Authentication authentication, @PathVariable String id, @RequestBody UpdateCourseRequest request) {
        return service.update(requireInstitutionId(authentication), id, request);
    }

    @PostMapping("/{id}/archive")
    public CourseResponse archive(Authentication authentication, @PathVariable String id) {
        return service.archive(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/restore")
    public CourseResponse restore(Authentication authentication, @PathVariable String id) {
        return service.restore(requireInstitutionId(authentication), id);
    }

    @GetMapping("/{id}/offerings")
    public List<CourseDepartmentOfferingResponse> offerings(Authentication authentication, @PathVariable String id) {
        return service.listOfferings(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/offerings")
    public ResponseEntity<CourseDepartmentOfferingResponse> addOffering(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody AddCourseDepartmentOfferingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addOffering(requireInstitutionId(authentication), id, request));
    }

    @DeleteMapping("/{id}/offerings/{offeringId}")
    public ResponseEntity<Void> removeOffering(
            Authentication authentication, @PathVariable String id, @PathVariable String offeringId) {
        service.removeOffering(requireInstitutionId(authentication), id, offeringId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/import", consumes = "multipart/form-data")
    public CourseImportResult importCsv(Authentication authentication, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file provided.");
        }
        String institutionId = requireInstitutionId(authentication);
        try {
            String text = new String(file.getBytes(), StandardCharsets.UTF_8);
            return service.importCsv(institutionId, text);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the uploaded file.");
        }
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            Authentication authentication, @RequestParam(defaultValue = "false") boolean includeArchived) {
        String csv = service.exportCsv(requireInstitutionId(authentication), includeArchived);
        byte[] body = csv.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("courses.csv").build().toString())
                .body(body);
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

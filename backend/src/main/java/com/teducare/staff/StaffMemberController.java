package com.teducare.staff;

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

/** Institution-scoped Staff Members ("All Staff", API_CONTRACT.md §8.1) — always "my own institution's staff", resolved from the caller. */
@RestController
@RequestMapping("/api/staff-members")
public class StaffMemberController {

    private final StaffMemberService service;
    private final AuthDirectory authDirectory;

    public StaffMemberController(StaffMemberService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<StaffMemberResponse> list(
            Authentication authentication,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.list(requireInstitutionId(authentication), departmentId, search, includeArchived);
    }

    @GetMapping("/{id}")
    public StaffMemberResponse get(Authentication authentication, @PathVariable String id) {
        return service.get(requireInstitutionId(authentication), id);
    }

    @PostMapping
    public ResponseEntity<StaffMemberResponse> create(
            Authentication authentication, @Valid @RequestBody CreateStaffMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(requireInstitutionId(authentication), request));
    }

    @PatchMapping("/{id}")
    public StaffMemberResponse update(
            Authentication authentication, @PathVariable String id, @RequestBody UpdateStaffMemberRequest request) {
        return service.update(requireInstitutionId(authentication), id, request);
    }

    @PostMapping("/{id}/archive")
    public StaffMemberResponse archive(Authentication authentication, @PathVariable String id) {
        return service.archive(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/restore")
    public StaffMemberResponse restore(Authentication authentication, @PathVariable String id) {
        return service.restore(requireInstitutionId(authentication), id);
    }

    @GetMapping("/{id}/qualifications")
    public List<StaffQualificationResponse> qualifications(Authentication authentication, @PathVariable String id) {
        return service.listQualifications(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/qualifications")
    public ResponseEntity<StaffQualificationResponse> addQualification(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody AddStaffQualificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addQualification(requireInstitutionId(authentication), id, request));
    }

    @DeleteMapping("/{id}/qualifications/{qualificationId}")
    public ResponseEntity<Void> deleteQualification(
            Authentication authentication, @PathVariable String id, @PathVariable String qualificationId) {
        service.deleteQualification(requireInstitutionId(authentication), id, qualificationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/import", consumes = "multipart/form-data")
    public StaffImportResult importCsv(Authentication authentication, @RequestParam("file") MultipartFile file) {
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
                        ContentDisposition.attachment().filename("staff-members.csv").build().toString())
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

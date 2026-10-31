package com.teducare.hostel;

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

/** A student's hostel housing workflow (API_CONTRACT.md §14.1) — always "my own institution's", resolved from the caller. */
@RestController
@RequestMapping("/api/hostel-allocations")
public class HostelAllocationController {

    private final HostelAllocationService service;
    private final AuthDirectory authDirectory;

    public HostelAllocationController(HostelAllocationService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<HostelAllocationResponse> list(
            Authentication authentication, @RequestParam(required = false) String status) {
        return service.list(requireInstitutionId(authentication), status);
    }

    @PostMapping
    public ResponseEntity<HostelAllocationResponse> addStudent(
            Authentication authentication, @Valid @RequestBody AddHostelAllocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addStudent(requireInstitutionId(authentication), request));
    }

    @GetMapping("/bulk-upload-template")
    public ResponseEntity<byte[]> bulkUploadTemplate(Authentication authentication) {
        String csv = service.bulkUploadTemplate(requireInstitutionId(authentication));
        byte[] body = csv.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("hostel-allocations-template.csv").build().toString())
                .body(body);
    }

    @PostMapping(value = "/bulk-upload", consumes = "multipart/form-data")
    public BulkHostelAllocationResult bulkUpload(
            Authentication authentication, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file provided.");
        }
        String institutionId = requireInstitutionId(authentication);
        try {
            String text = new String(file.getBytes(), StandardCharsets.UTF_8);
            return service.bulkUploadAllocations(institutionId, text);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read the uploaded file.");
        }
    }

    @PostMapping("/{id}/propose")
    public HostelAllocationResponse propose(
            Authentication authentication, @PathVariable String id, @Valid @RequestBody AssignRoomRequest request) {
        return service.propose(requireInstitutionId(authentication), id, request);
    }

    @PostMapping("/{id}/confirm")
    public HostelAllocationResponse confirm(
            Authentication authentication, @PathVariable String id, @Valid @RequestBody AssignRoomRequest request) {
        return service.confirm(requireInstitutionId(authentication), id, request);
    }

    @PostMapping("/{id}/waitlist")
    public HostelAllocationResponse moveToWaitlist(Authentication authentication, @PathVariable String id) {
        return service.moveToWaitlist(requireInstitutionId(authentication), id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(Authentication authentication, @PathVariable String id) {
        service.remove(requireInstitutionId(authentication), id);
        return ResponseEntity.noContent().build();
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

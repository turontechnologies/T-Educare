package com.teducare.announcement;

import java.util.List;

import org.springframework.http.HttpStatus;
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
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/** School-wide/students/staff/hostel-residents broadcasts (API_CONTRACT.md §15) — always "my own institution's", resolved from the caller. */
@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementService service;
    private final AuthDirectory authDirectory;

    public AnnouncementController(AnnouncementService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<AnnouncementResponse> list(
            Authentication authentication, @RequestParam(required = false) String status) {
        return service.list(requireInstitutionId(authentication), status);
    }

    @GetMapping("/targets")
    public List<TargetOptionResponse> targetOptions(
            Authentication authentication, @RequestParam String scope) {
        return service.targetOptions(requireInstitutionId(authentication), scope);
    }

    @PostMapping
    public ResponseEntity<AnnouncementResponse> create(
            Authentication authentication, @Valid @RequestBody CreateAnnouncementRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(caller.institutionId(), callerDisplayName(caller), request));
    }

    @PatchMapping("/{id}")
    public AnnouncementResponse update(
            Authentication authentication, @PathVariable String id, @Valid @RequestBody UpdateAnnouncementRequest request) {
        return service.update(requireInstitutionId(authentication), id, request);
    }

    @PostMapping("/{id}/send")
    public AnnouncementResponse sendNow(Authentication authentication, @PathVariable String id) {
        return service.sendNow(requireInstitutionId(authentication), id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable String id) {
        service.delete(requireInstitutionId(authentication), id);
        return ResponseEntity.noContent().build();
    }

    private String callerDisplayName(AuthenticatedUserDto caller) {
        return caller.firstName() + " " + caller.lastName() + ", Administrator";
    }

    private String requireInstitutionId(Authentication authentication) {
        return requireCaller(authentication).institutionId();
    }

    private AuthenticatedUserDto requireCaller(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        AuthenticatedUserDto caller = authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));

        if (!"institution_admin".equals(caller.role()) || caller.institutionId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Institution admin access required.");
        }
        return caller;
    }
}

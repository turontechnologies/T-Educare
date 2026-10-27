package com.teducare.hostel;

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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/** Hostels and their rooms (API_CONTRACT.md §14.1) — always "my own institution's", resolved from the caller. */
@RestController
@RequestMapping("/api/hostels")
public class HostelController {

    private final HostelService service;
    private final AuthDirectory authDirectory;

    public HostelController(HostelService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<HostelResponse> list(Authentication authentication) {
        return service.list(requireInstitutionId(authentication));
    }

    @PostMapping
    public ResponseEntity<HostelResponse> create(
            Authentication authentication, @Valid @RequestBody CreateHostelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(requireInstitutionId(authentication), request));
    }

    @PatchMapping("/{id}")
    public HostelResponse update(
            Authentication authentication, @PathVariable String id, @Valid @RequestBody UpdateHostelRequest request) {
        return service.update(requireInstitutionId(authentication), id, request);
    }

    @GetMapping("/{id}/roster")
    public List<HostelRosterStudent> roster(Authentication authentication, @PathVariable String id) {
        return service.roster(requireInstitutionId(authentication), id);
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

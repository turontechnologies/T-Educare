package com.teducare.elective;

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

/** Institution-scoped Elective Groups — always "my own institution's groups", resolved from the caller. */
@RestController
@RequestMapping("/api/elective-groups")
public class ElectiveGroupController {

    private final ElectiveGroupService service;
    private final AuthDirectory authDirectory;

    public ElectiveGroupController(ElectiveGroupService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<ElectiveGroupResponse> list(
            Authentication authentication, @RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.list(requireInstitutionId(authentication), includeArchived);
    }

    @PostMapping
    public ResponseEntity<ElectiveGroupResponse> create(
            Authentication authentication, @Valid @RequestBody CreateElectiveGroupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(requireInstitutionId(authentication), request));
    }

    @PatchMapping("/{id}")
    public ElectiveGroupResponse update(
            Authentication authentication, @PathVariable String id, @RequestBody UpdateElectiveGroupRequest request) {
        return service.update(requireInstitutionId(authentication), id, request);
    }

    @PostMapping("/{id}/archive")
    public ElectiveGroupResponse archive(Authentication authentication, @PathVariable String id) {
        return service.archive(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/restore")
    public ElectiveGroupResponse restore(Authentication authentication, @PathVariable String id) {
        return service.restore(requireInstitutionId(authentication), id);
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

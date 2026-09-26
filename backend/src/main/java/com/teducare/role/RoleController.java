package com.teducare.role;

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

/**
 * Institution-scoped Roles (API_CONTRACT.md §12) — always "my own
 * institution's roles", resolved from the caller, never an id in the path.
 * institution_admin only; a super_admin has no institution of their own to
 * scope this to.
 */
@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleService roleService;
    private final AuthDirectory authDirectory;

    public RoleController(RoleService roleService, AuthDirectory authDirectory) {
        this.roleService = roleService;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public List<RoleResponse> list(Authentication authentication) {
        return roleService.list(requireInstitutionId(authentication));
    }

    @PostMapping
    public ResponseEntity<RoleResponse> create(
            Authentication authentication, @Valid @RequestBody CreateRoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(roleService.create(requireInstitutionId(authentication), request));
    }

    @PatchMapping("/{id}")
    public RoleResponse update(
            Authentication authentication, @PathVariable String id, @RequestBody UpdateRoleRequest request) {
        return roleService.update(requireInstitutionId(authentication), id, request);
    }

    @PostMapping("/{id}/archive")
    public RoleResponse archive(Authentication authentication, @PathVariable String id) {
        return roleService.archive(requireInstitutionId(authentication), id);
    }

    @PostMapping("/{id}/restore")
    public RoleResponse restore(Authentication authentication, @PathVariable String id) {
        return roleService.restore(requireInstitutionId(authentication), id);
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

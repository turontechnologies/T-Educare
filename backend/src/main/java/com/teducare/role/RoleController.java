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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/**
 * Institution-scoped Roles (API_CONTRACT.md §5) — always "my own
 * institution's roles" for an institution_admin caller, resolved from the
 * caller, never an id in the path. Creating/editing/archiving a role stays
 * self-service only (institution_admin) — a super_admin can additionally
 * *view* any institution's roles via {@code ?institutionId=} on the list
 * endpoint, so their own User Manager UI can offer a role picker even for
 * an institution whose only admin is themselves too restricted to reach
 * `/dashboard/user-management` and fix it (a real, hit-live scenario, not
 * hypothetical — see frontend/CLAUDE.md).
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
    public List<RoleResponse> list(
            Authentication authentication, @RequestParam(required = false) String institutionId) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        if ("super_admin".equals(caller.role())) {
            if (institutionId == null || institutionId.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "institutionId is required.");
            }
            return roleService.list(institutionId);
        }
        return roleService.list(requireOwnInstitutionId(caller));
    }

    @PostMapping
    public ResponseEntity<RoleResponse> create(
            Authentication authentication, @Valid @RequestBody CreateRoleRequest request) {
        String institutionId = requireOwnInstitutionId(requireCaller(authentication));
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.create(institutionId, request));
    }

    @PatchMapping("/{id}")
    public RoleResponse update(
            Authentication authentication, @PathVariable String id, @RequestBody UpdateRoleRequest request) {
        String institutionId = requireOwnInstitutionId(requireCaller(authentication));
        return roleService.update(institutionId, id, request);
    }

    @PostMapping("/{id}/archive")
    public RoleResponse archive(Authentication authentication, @PathVariable String id) {
        String institutionId = requireOwnInstitutionId(requireCaller(authentication));
        return roleService.archive(institutionId, id);
    }

    @PostMapping("/{id}/restore")
    public RoleResponse restore(Authentication authentication, @PathVariable String id) {
        String institutionId = requireOwnInstitutionId(requireCaller(authentication));
        return roleService.restore(institutionId, id);
    }

    private AuthenticatedUserDto requireCaller(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        return authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));
    }

    /** Creating/editing/archiving a role stays institution_admin self-service only — a super_admin has no institution of their own to scope a mutation to. */
    private String requireOwnInstitutionId(AuthenticatedUserDto caller) {
        if (!"institution_admin".equals(caller.role()) || caller.institutionId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Institution admin access required.");
        }
        return caller.institutionId();
    }
}

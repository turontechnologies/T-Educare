package com.teducare.usermanager;

import java.util.Map;

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
 * super_admin manages every institution's User Manager accounts, unscoped.
 * institution_admin manages only their own institution's staff — the
 * "Users" tab of /dashboard/user-management (API_CONTRACT.md §6) is this
 * same resource, self-scoped, not a separate one.
 */
@RestController
@RequestMapping("/api")
public class UserManagerController {

    private final UserManagerService userManagerService;
    private final AuthDirectory authDirectory;

    public UserManagerController(UserManagerService userManagerService, AuthDirectory authDirectory) {
        this.userManagerService = userManagerService;
        this.authDirectory = authDirectory;
    }

    @GetMapping("/user-managers")
    public Map<String, Object> list(
            Authentication authentication,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean includeArchived) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        String scopedToInstitutionId = "institution_admin".equals(caller.role()) ? caller.institutionId() : null;
        return userManagerService.list(page, perPage, search, includeArchived, scopedToInstitutionId);
    }

    @GetMapping("/user-managers/{id}")
    public UserManagerResponse get(Authentication authentication, @PathVariable String id) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        UserManagerResponse account = userManagerService.get(id);
        requireOwnInstitutionIfNotSuperAdmin(caller, account.institutionId());
        return account;
    }

    @PostMapping("/user-managers")
    public ResponseEntity<UserManagerResponse> create(
            Authentication authentication, @Valid @RequestBody CreateUserManagerRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        if ("institution_admin".equals(caller.role())) {
            // Self-service staff creation is scoped to the caller's own
            // institution and can never mint another unrestricted root
            // admin for it — that stays a super_admin-only action.
            request = new CreateUserManagerRequest(
                    request.firstName(), request.otherName(), request.lastName(), request.gender(),
                    request.email(), request.phone(), request.username(), request.password(),
                    caller.institutionId(), false, request.avatarUrl());
        } else {
            requireSuperAdmin(caller);
            if (request.institutionId() == null || request.institutionId().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Institution is required.");
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(userManagerService.create(request));
    }

    @PatchMapping("/user-managers/{id}")
    public UserManagerResponse update(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody UpdateUserManagerRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        UserManagerResponse existing = userManagerService.get(id);
        requireOwnInstitutionIfNotSuperAdmin(caller, existing.institutionId());

        if ("institution_admin".equals(caller.role())) {
            // A staff member's institution assignment and primary-admin
            // status are platform-level decisions, not self-service ones —
            // only roleId (and the plain HR fields) are theirs to change.
            if (request.institutionId() != null || request.isPrimaryAdmin() != null) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Only a super admin can reassign an institution or primary-admin status.");
            }
        }
        return userManagerService.update(id, request);
    }

    @PatchMapping("/user-managers/{id}/status")
    public UserManagerResponse updateStatus(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody UserManagerStatusRequest request) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        requireOwnInstitutionIfNotSuperAdmin(caller, userManagerService.get(id).institutionId());
        return userManagerService.updateStatus(id, request.status());
    }

    @PostMapping("/user-managers/{id}/reset-password")
    public ResetPasswordResponse resetPassword(Authentication authentication, @PathVariable String id) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        requireOwnInstitutionIfNotSuperAdmin(caller, userManagerService.get(id).institutionId());
        return new ResetPasswordResponse(userManagerService.resetPassword(id));
    }

    @PostMapping("/user-managers/{id}/archive")
    public UserManagerResponse archive(Authentication authentication, @PathVariable String id) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        requireOwnInstitutionIfNotSuperAdmin(caller, userManagerService.get(id).institutionId());
        return userManagerService.archive(id);
    }

    @PostMapping("/user-managers/{id}/restore")
    public UserManagerResponse restore(Authentication authentication, @PathVariable String id) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        requireOwnInstitutionIfNotSuperAdmin(caller, userManagerService.get(id).institutionId());
        return userManagerService.restore(id);
    }

    private AuthenticatedUserDto requireCaller(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        AuthenticatedUserDto caller = authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));

        if (!"super_admin".equals(caller.role()) && !"institution_admin".equals(caller.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
        return caller;
    }

    private void requireSuperAdmin(AuthenticatedUserDto caller) {
        if (!"super_admin".equals(caller.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super admin access required.");
        }
    }

    /** An institution_admin may only ever act on their own institution's accounts — never leaked as 403 vs 404, just refused. */
    private void requireOwnInstitutionIfNotSuperAdmin(AuthenticatedUserDto caller, String targetInstitutionId) {
        if ("super_admin".equals(caller.role())) {
            return;
        }
        if (!caller.institutionId().equals(targetInstitutionId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
    }
}

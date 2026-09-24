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

import jakarta.validation.Valid;

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
        requireSuperAdmin(authentication);
        return userManagerService.list(page, perPage, search, includeArchived);
    }

    @GetMapping("/user-managers/{id}")
    public UserManagerResponse get(Authentication authentication, @PathVariable String id) {
        requireSuperAdmin(authentication);
        return userManagerService.get(id);
    }

    @PostMapping("/user-managers")
    public ResponseEntity<UserManagerResponse> create(
            Authentication authentication, @Valid @RequestBody CreateUserManagerRequest request) {
        requireSuperAdmin(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(userManagerService.create(request));
    }

    @PatchMapping("/user-managers/{id}")
    public UserManagerResponse update(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody UpdateUserManagerRequest request) {
        requireSuperAdmin(authentication);
        return userManagerService.update(id, request);
    }

    @PatchMapping("/user-managers/{id}/status")
    public UserManagerResponse updateStatus(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody UserManagerStatusRequest request) {
        requireSuperAdmin(authentication);
        return userManagerService.updateStatus(id, request.status());
    }

    @PostMapping("/user-managers/{id}/reset-password")
    public ResetPasswordResponse resetPassword(Authentication authentication, @PathVariable String id) {
        requireSuperAdmin(authentication);
        return new ResetPasswordResponse(userManagerService.resetPassword(id));
    }

    @PostMapping("/user-managers/{id}/archive")
    public UserManagerResponse archive(Authentication authentication, @PathVariable String id) {
        requireSuperAdmin(authentication);
        return userManagerService.archive(id);
    }

    @PostMapping("/user-managers/{id}/restore")
    public UserManagerResponse restore(Authentication authentication, @PathVariable String id) {
        requireSuperAdmin(authentication);
        return userManagerService.restore(id);
    }

    /** Same manual guard as InstitutionController — see its own note on why (no Spring authorities set up yet). */
    private void requireSuperAdmin(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        String role = authDirectory.find(authentication.getName())
                .map(account -> account.user().role())
                .orElse(null);

        if (!"super_admin".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super admin access required.");
        }
    }
}

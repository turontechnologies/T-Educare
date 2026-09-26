package com.teducare.institution;

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

@RestController
@RequestMapping("/api")
public class InstitutionController {

    private final InstitutionService institutionService;
    private final AuthDirectory authDirectory;

    public InstitutionController(InstitutionService institutionService, AuthDirectory authDirectory) {
        this.institutionService = institutionService;
        this.authDirectory = authDirectory;
    }

    @GetMapping("/institutions")
    public Map<String, Object> list(
            Authentication authentication,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int perPage,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean includeArchived,
            @RequestParam(defaultValue = "false") boolean unlinkedOnly,
            @RequestParam(defaultValue = "false") boolean unlicensedOnly) {
        AuthenticatedUserDto caller = requireCaller(authentication);

        // An institution_admin calls this same endpoint (dashboard/layout.tsx,
        // role-dialog.tsx) to resolve their own institution's live
        // moduleKeys/name/logo — but must never see the full platform list
        // (§1's multi-tenancy rule), so they get a single-row view instead of
        // a 403. Everyone else needs to be a super admin.
        if ("institution_admin".equals(caller.role())) {
            return institutionService.listOwn(caller.institutionId());
        }
        if (!"super_admin".equals(caller.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied.");
        }
        return institutionService.list(page, perPage, search, includeArchived, unlinkedOnly, unlicensedOnly);
    }

    @GetMapping("/institutions/{id}")
    public InstitutionResponse get(Authentication authentication, @PathVariable String id) {
        requireSuperAdmin(authentication);
        return institutionService.get(id);
    }

    @PostMapping("/institutions")
    public ResponseEntity<InstitutionResponse> create(
            Authentication authentication, @Valid @RequestBody CreateInstitutionRequest request) {
        requireSuperAdmin(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(institutionService.create(request));
    }

    @PatchMapping("/institutions/{id}")
    public InstitutionResponse update(
            Authentication authentication,
            @PathVariable String id,
            @RequestBody UpdateInstitutionRequest request) {
        requireSuperAdmin(authentication);
        return institutionService.update(id, request);
    }

    @PatchMapping("/institutions/{id}/status")
    public InstitutionResponse updateStatus(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody InstitutionStatusRequest request) {
        requireSuperAdmin(authentication);
        return institutionService.updateStatus(id, request.status());
    }

    @PostMapping("/institutions/{id}/archive")
    public InstitutionResponse archive(Authentication authentication, @PathVariable String id) {
        requireSuperAdmin(authentication);
        return institutionService.archive(id);
    }

    @PostMapping("/institutions/{id}/restore")
    public InstitutionResponse restore(Authentication authentication, @PathVariable String id) {
        requireSuperAdmin(authentication);
        return institutionService.restore(id);
    }

    @PatchMapping("/institutions/{id}/modules")
    public InstitutionResponse linkModules(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody LinkModulesRequest request) {
        requireSuperAdmin(authentication);
        return institutionService.linkModules(id, request.moduleKeys());
    }

    @PatchMapping("/institutions/{id}/license")
    public InstitutionResponse saveLicense(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody LicenseRequest request) {
        requireSuperAdmin(authentication);
        return institutionService.saveLicense(id, request);
    }

    @PostMapping("/institutions/{id}/regenerate-license-key")
    public Map<String, String> regenerateLicenseKey(Authentication authentication, @PathVariable String id) {
        requireSuperAdmin(authentication);
        return institutionService.regenerateLicenseKey(id);
    }

    @PostMapping("/institutions/{id}/revoke-license")
    public InstitutionResponse revokeLicense(Authentication authentication, @PathVariable String id) {
        requireSuperAdmin(authentication);
        return institutionService.revokeLicense(id);
    }

    /** Institutions routes are super-admin only per API_CONTRACT.md §4 — no Spring authorities exist yet (see JwtAuthenticationFilter), so this resolves the caller's real role the same way ProfileController/DashboardController resolve identity: via AuthDirectory. */
    private void requireSuperAdmin(Authentication authentication) {
        if (!"super_admin".equals(requireCaller(authentication).role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super admin access required.");
        }
    }

    private AuthenticatedUserDto requireCaller(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        return authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));
    }
}

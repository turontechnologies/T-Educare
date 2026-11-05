package com.teducare.finance;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

import jakarta.validation.Valid;

/**
 * Per-institution Paystack credentials — **super admin only**. A real
 * secret key never leaves this service once set: {@link
 * PaystackSettingsResponse} reports only whether one is configured, and
 * every write goes straight into {@link PaystackSettings}, read back out
 * server-side only by {@code FinanceService} when generating a payment
 * link or verifying a webhook.
 */
@RestController
@RequestMapping("/api/super-admin/institutions/{institutionId}/paystack-settings")
public class PaystackSettingsController {

    private final FinanceService service;
    private final AuthDirectory authDirectory;

    public PaystackSettingsController(FinanceService service, AuthDirectory authDirectory) {
        this.service = service;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public PaystackSettingsResponse get(Authentication authentication, @PathVariable String institutionId) {
        requireSuperAdmin(authentication);
        return service.getPaystackSettings(institutionId);
    }

    @PutMapping
    public PaystackSettingsResponse update(
            Authentication authentication, @PathVariable String institutionId,
            @Valid @RequestBody PaystackSettingsRequest request) {
        requireSuperAdmin(authentication);
        return service.updatePaystackSettings(institutionId, request);
    }

    private void requireSuperAdmin(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }
        AuthenticatedUserDto caller = authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));
        if (!"super_admin".equals(caller.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Super admin access required.");
        }
    }
}

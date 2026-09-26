package com.teducare.module;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;

@RestController
@RequestMapping("/api")
public class ModuleController {

    private final AuthDirectory authDirectory;

    public ModuleController(AuthDirectory authDirectory) {
        this.authDirectory = authDirectory;
    }

    @GetMapping("/modules")
    public Map<String, Object> list(Authentication authentication) {
        requireSuperAdmin(authentication);
        return Map.of("data", ModuleCatalog.ALL);
    }

    /** Same manual guard as InstitutionController/UserManagerController — no Spring authorities exist yet. */
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

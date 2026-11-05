package com.teducare.institution;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Unauthenticated — resolves an institution's own scoped URL slug to just enough branding to render a tenant-specific login screen, on both the admin app (`/login/{slug}`) and the Student Portal (`/{slug}/login`). Registered as permitAll in SecurityConfig. */
@RestController
@RequestMapping("/api/public/institutions")
public class PublicInstitutionController {

    private final InstitutionService service;

    public PublicInstitutionController(InstitutionService service) {
        this.service = service;
    }

    @GetMapping("/by-slug/{slug}")
    public InstitutionBrandingResponse bySlug(@PathVariable String slug) {
        return InstitutionBrandingResponse.from(service.requireBySlug(slug));
    }
}

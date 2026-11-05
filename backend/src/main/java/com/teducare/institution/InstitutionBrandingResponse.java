package com.teducare.institution;

/** Deliberately minimal — only what an unauthenticated login screen needs to render a tenant-branded header (admin app's `/login/{slug}` and the Student Portal's `/{slug}/login`). Never leaks anything else about the institution. */
public record InstitutionBrandingResponse(String id, String slug, String name, String logoUrl) {

    static InstitutionBrandingResponse from(Institution institution) {
        return new InstitutionBrandingResponse(
                institution.getId(), institution.getSlug(), institution.getName(), institution.getLogoUrl());
    }
}

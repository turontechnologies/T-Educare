package com.teducare.institution;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InstitutionService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private final InstitutionRepository repository;

    public InstitutionService(InstitutionRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> list(int page, int perPage, String search, boolean includeArchived) {
        int safePage = Math.max(1, page);
        int safePerPage = Math.max(1, perPage);
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        Page<Institution> result = repository.search(
                normalizedSearch, includeArchived, PageRequest.of(safePage - 1, safePerPage));

        return Map.of(
                "data", result.getContent().stream().map(InstitutionResponse::from).toList(),
                "meta", Map.of(
                        "page", safePage,
                        "perPage", safePerPage,
                        "total", result.getTotalElements()));
    }

    public InstitutionResponse get(String id) {
        return InstitutionResponse.from(requireInstitution(id));
    }

    public InstitutionResponse create(CreateInstitutionRequest request) {
        String id = "inst-" + UUID.randomUUID();
        String code = String.format("%03d", repository.count() + 1);

        Institution institution = new Institution(
                id,
                code,
                request.name(),
                request.institutionType(),
                request.address(),
                request.city(),
                request.countryState(),
                request.principalName(),
                request.principalEmail(),
                request.principalPhone(),
                request.adminUser(),
                request.adminEmail(),
                request.logoUrl(),
                null,
                null,
                0,
                0,
                0L,
                "Basic",
                null,
                generateTokenKey(),
                null,
                null,
                "active",
                Instant.now(),
                null);

        return InstitutionResponse.from(repository.save(institution));
    }

    public InstitutionResponse update(String id, UpdateInstitutionRequest request) {
        Institution institution = requireInstitution(id);

        if (isPresent(request.name())) {
            institution.setName(request.name());
        }
        if (isPresent(request.institutionType())) {
            institution.setInstitutionType(request.institutionType());
        }
        if (request.address() != null) {
            institution.setAddress(request.address());
        }
        if (request.city() != null) {
            institution.setCity(request.city());
        }
        if (request.countryState() != null) {
            institution.setCountryState(request.countryState());
        }
        if (request.principalName() != null) {
            institution.setPrincipalName(request.principalName());
        }
        if (request.principalEmail() != null) {
            institution.setPrincipalEmail(request.principalEmail());
        }
        if (request.principalPhone() != null) {
            institution.setPrincipalPhone(request.principalPhone());
        }
        if (request.adminUser() != null) {
            institution.setAdminUser(request.adminUser());
        }
        if (request.adminEmail() != null) {
            institution.setAdminEmail(request.adminEmail());
        }
        if (request.logoUrl() != null) {
            institution.setLogoUrl(request.logoUrl());
        }

        return InstitutionResponse.from(repository.save(institution));
    }

    public InstitutionResponse updateStatus(String id, String status) {
        if (!"active".equals(status) && !"inactive".equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be 'active' or 'inactive'.");
        }

        Institution institution = requireInstitution(id);
        institution.setStatus(status);
        return InstitutionResponse.from(repository.save(institution));
    }

    public InstitutionResponse archive(String id) {
        Institution institution = requireInstitution(id);
        institution.setArchivedAt(Instant.now());
        return InstitutionResponse.from(repository.save(institution));
    }

    public InstitutionResponse restore(String id) {
        Institution institution = requireInstitution(id);
        institution.setArchivedAt(null);
        return InstitutionResponse.from(repository.save(institution));
    }

    private Institution requireInstitution(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution not found."));
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private static String generateTokenKey() {
        StringBuilder key = new StringBuilder();
        for (int group = 0; group < 4; group++) {
            if (group > 0) {
                key.append('-');
            }
            for (int i = 0; i < 4; i++) {
                key.append(TOKEN_ALPHABET.charAt(RANDOM.nextInt(TOKEN_ALPHABET.length())));
            }
        }
        return key.toString();
    }
}

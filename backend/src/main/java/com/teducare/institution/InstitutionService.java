package com.teducare.institution;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.module.ModuleCatalog;

@Service
public class InstitutionService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private final InstitutionRepository repository;

    public InstitutionService(InstitutionRepository repository) {
        this.repository = repository;
    }

    public Map<String, Object> list(
            int page,
            int perPage,
            String search,
            boolean includeArchived,
            boolean unlinkedOnly,
            boolean unlicensedOnly) {
        int safePage = Math.max(1, page);
        int safePerPage = Math.max(1, perPage);
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        Page<Institution> result = repository.search(
                normalizedSearch,
                includeArchived,
                unlinkedOnly,
                unlicensedOnly,
                PageRequest.of(safePage - 1, safePerPage));

        return Map.of(
                "data", result.getContent().stream().map(InstitutionResponse::from).toList(),
                "meta", Map.of(
                        "page", safePage,
                        "perPage", safePerPage,
                        "total", result.getTotalElements()));
    }

    /**
     * Multi-tenancy-scoped view for an institution_admin caller — they may
     * only ever see their own institution record (§1's multi-tenancy rule),
     * never the full platform list `list()` above returns for a super admin.
     * Shape-compatible with `list()`'s response so `dashboard/layout.tsx` and
     * `role-dialog.tsx` (both of which resolve their own institution's live
     * moduleKeys/name/logo from this same `GET /institutions` response) need
     * no special-casing on the frontend.
     */
    public Map<String, Object> listOwn(String institutionId) {
        List<InstitutionResponse> data = institutionId == null
                ? List.of()
                : repository.findById(institutionId).map(InstitutionResponse::from).map(List::of).orElseGet(List::of);

        return Map.of(
                "data", data,
                "meta", Map.of("page", 1, "perPage", data.size(), "total", data.size()));
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

    /**
     * API_CONTRACT.md §4.6.2 — saving an institution's modules also
     * activates it (status = "active") as an explicit side effect, matching
     * the "X is been selected and made active" copy in the "Link New
     * Institution" dialog.
     */
    public InstitutionResponse linkModules(String id, List<String> moduleKeys) {
        Institution institution = requireInstitution(id);
        List<String> keys = moduleKeys == null ? List.of() : moduleKeys;

        for (String key : keys) {
            if (!ModuleCatalog.KEYS.contains(key)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown module key: " + key);
            }
        }

        institution.setModuleKeys(keys.isEmpty() ? null : String.join(",", keys));
        institution.setModulesCount(keys.size());
        institution.setModulesLastEditedAt(Instant.now());
        institution.setStatus("active");
        return InstitutionResponse.from(repository.save(institution));
    }

    /**
     * API_CONTRACT.md §4.7.1 — "Basic" forces expiringAt to null server-side
     * regardless of what's sent (it's the free, never-expiring tier); any
     * other type requires expiringAt (422 if missing). licenseIssuedAt is
     * set to now() only the first time this institution ever gets a
     * license — immutable afterwards, so re-editing an existing license
     * (type/key/expiry changes) never resets its original issue date.
     */
    public InstitutionResponse saveLicense(String id, LicenseRequest request) {
        Institution institution = requireInstitution(id);

        String licenseType = request.licenseType();
        if (!List.of("Basic", "Standard", "Premium").contains(licenseType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "licenseType must be 'Basic', 'Standard', or 'Premium'.");
        }

        boolean isBasic = "Basic".equals(licenseType);
        if (!isBasic && request.expiringAt() == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNPROCESSABLE_ENTITY, "expiringAt is required unless licenseType is 'Basic'.");
        }

        institution.setLicenseType(licenseType);
        institution.setExpiringAt(isBasic ? null : request.expiringAt());
        institution.setLicenseKey(request.licenseKey());
        if (institution.getLicenseIssuedAt() == null) {
            institution.setLicenseIssuedAt(Instant.now());
        }

        return InstitutionResponse.from(repository.save(institution));
    }

    public Map<String, String> regenerateLicenseKey(String id) {
        Institution institution = requireInstitution(id);
        if (institution.getLicenseKey() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Institution has no license to regenerate a key for.");
        }

        String newKey = generateTokenKey();
        institution.setLicenseKey(newKey);
        repository.save(institution);
        return Map.of("licenseKey", newKey);
    }

    /** Resets to the unlicensed defaults — does not archive or delete the institution itself. */
    public InstitutionResponse revokeLicense(String id) {
        Institution institution = requireInstitution(id);
        institution.setLicenseType("Basic");
        institution.setLicenseKey(null);
        institution.setExpiringAt(null);
        institution.setLicenseIssuedAt(null);
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

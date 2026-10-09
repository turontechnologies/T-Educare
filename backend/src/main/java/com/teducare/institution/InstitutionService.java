package com.teducare.institution;

import java.security.SecureRandom;
import java.time.Duration;
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
import com.teducare.notification.NotificationService;

@Service
public class InstitutionService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String TOKEN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final String SUPER_ADMIN_HREF = "/super-admin/institutions";
    private static final int DEFAULT_GRACE_DAYS = 14;
    private static final String SYSTEM_ACTOR = "SYSTEM";

    private final InstitutionRepository repository;
    private final NotificationService notificationService;
    private final InstitutionLicenseEventRepository licenseEventRepository;

    public InstitutionService(
            InstitutionRepository repository,
            NotificationService notificationService,
            InstitutionLicenseEventRepository licenseEventRepository) {
        this.repository = repository;
        this.notificationService = notificationService;
        this.licenseEventRepository = licenseEventRepository;
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
                "ACTIVE",
                null,
                Instant.now(),
                null);

        Institution saved = repository.save(institution);
        notificationService.notifyPlatform(
                "New institution added",
                saved.getName() + " was added to the platform.",
                SUPER_ADMIN_HREF);
        return InstitutionResponse.from(saved);
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

        Institution saved = repository.save(institution);
        notificationService.notifyPlatform(
                "Institution updated", saved.getName() + "'s details were updated.", SUPER_ADMIN_HREF);
        notificationService.notifyInstitution(
                saved.getId(),
                "Your institution's details were updated",
                "The platform administrator updated your institution's profile.",
                null);
        return InstitutionResponse.from(saved);
    }

    public InstitutionResponse updateStatus(String id, String status) {
        if (!"active".equals(status) && !"inactive".equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be 'active' or 'inactive'.");
        }

        Institution institution = requireInstitution(id);
        institution.setStatus(status);
        Institution saved = repository.save(institution);

        String verb = "active".equals(status) ? "activated" : "deactivated";
        notificationService.notifyPlatform(
                "Institution " + verb, saved.getName() + " was " + verb + ".", SUPER_ADMIN_HREF);
        notificationService.notifyInstitution(
                saved.getId(),
                "Your institution was " + verb,
                "active".equals(status)
                        ? "Your institution has regained full access to the platform."
                        : "Your institution has lost access to the platform until reactivated.",
                null);
        return InstitutionResponse.from(saved);
    }

    public InstitutionResponse archive(String id) {
        Institution institution = requireInstitution(id);
        institution.setArchivedAt(Instant.now());
        Institution saved = repository.save(institution);

        notificationService.notifyPlatform(
                "Institution deleted", saved.getName() + " was moved to the archive.", SUPER_ADMIN_HREF);
        notificationService.notifyInstitution(
                saved.getId(),
                "Your institution was deleted",
                "Your institution was archived by the platform administrator.",
                null);
        return InstitutionResponse.from(saved);
    }

    public InstitutionResponse restore(String id) {
        Institution institution = requireInstitution(id);
        institution.setArchivedAt(null);
        Institution saved = repository.save(institution);

        notificationService.notifyPlatform(
                "Institution restored", saved.getName() + " was restored from the archive.", SUPER_ADMIN_HREF);
        notificationService.notifyInstitution(
                saved.getId(),
                "Institution restored",
                "Your institution has been restored and is visible on the platform again.",
                null);
        return InstitutionResponse.from(saved);
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
        Institution saved = repository.save(institution);

        String moduleWord = keys.size() == 1 ? "module" : "modules";
        notificationService.notifyPlatform(
                "Modules updated",
                saved.getName() + " now has " + keys.size() + " " + moduleWord + " active.",
                "/super-admin/modules");
        notificationService.notifyInstitution(
                saved.getId(),
                "Your modules were updated",
                "Your institution now has " + keys.size() + " " + moduleWord + " active.",
                null);
        return InstitutionResponse.from(saved);
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

        Institution saved = repository.save(institution);
        notificationService.notifyPlatform(
                "License saved",
                saved.getName() + "'s license was set to " + licenseType + ".",
                "/super-admin/license-manager");
        notificationService.notifyInstitution(
                saved.getId(),
                "Your license was updated",
                "Your institution's license is now " + licenseType + ".",
                null);
        return InstitutionResponse.from(saved);
    }

    public Map<String, String> regenerateLicenseKey(String id) {
        Institution institution = requireInstitution(id);
        if (institution.getLicenseKey() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Institution has no license to regenerate a key for.");
        }

        String newKey = generateTokenKey();
        institution.setLicenseKey(newKey);
        Institution saved = repository.save(institution);

        notificationService.notifyPlatform(
                "License key regenerated",
                "The license key for " + saved.getName() + " was regenerated.",
                "/super-admin/license-manager");
        notificationService.notifyInstitution(
                saved.getId(),
                "Your license key was regenerated",
                "Your institution's license key was regenerated by the platform administrator.",
                null);
        return Map.of("licenseKey", newKey);
    }

    /**
     * Resets to the unlicensed defaults — does not archive or delete the
     * institution itself. Also resets licenseStatus/graceEndsAt back to the
     * unlicensed-Basic baseline (§4.8) — there's no sensible "this free-tier
     * institution is suspended/in grace" state, so an institution that was
     * GRACE_PERIOD or SUSPENDED when revoked doesn't stay locked out after
     * its license was just reset to clean. Does NOT record a RENEWED event
     * in the license-events audit log — that log is specifically about
     * licenseStatus transitions driven by start-grace-period/renew-license/
     * the sweep, not every mutation that happens to touch these fields as a
     * side effect.
     */
    public InstitutionResponse revokeLicense(String id) {
        Institution institution = requireInstitution(id);
        institution.setLicenseType("Basic");
        institution.setLicenseKey(null);
        institution.setExpiringAt(null);
        institution.setLicenseIssuedAt(null);
        institution.setLicenseStatus("ACTIVE");
        institution.setGraceEndsAt(null);
        Institution saved = repository.save(institution);

        notificationService.notifyPlatform(
                "License revoked",
                saved.getName() + "'s license was revoked and reset to Basic.",
                "/super-admin/license-manager");
        notificationService.notifyInstitution(
                saved.getId(),
                "Your license was revoked",
                "Your institution's license was revoked and reset to Basic.",
                null);
        return InstitutionResponse.from(saved);
    }

    /**
     * Transitions ACTIVE -> GRACE_PERIOD (API_CONTRACT.md §4.8) — distinct
     * from {@code revokeLicense} above, which resets an institution to the
     * unlicensed Basic tier. This is the payment-default/license-expiry
     * flow: continued access for a grace window before the scheduled sweep
     * (see LicenseSweepScheduler) suspends it.
     */
    public InstitutionResponse startGracePeriod(String id, String actorId, StartGracePeriodRequest request) {
        Institution institution = requireInstitution(id);

        int graceDays = request.graceDays() == null ? DEFAULT_GRACE_DAYS : request.graceDays();
        if (graceDays <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "graceDays must be positive.");
        }

        Instant graceEndsAt = Instant.now().plus(Duration.ofDays(graceDays));
        institution.setLicenseStatus("GRACE_PERIOD");
        institution.setGraceEndsAt(graceEndsAt);
        Institution saved = repository.save(institution);

        recordLicenseEvent(saved.getId(), "GRACE_STARTED", request.reason(), actorId, graceEndsAt);

        notificationService.notifyPlatform(
                "Institution entered grace period",
                saved.getName() + "'s license grace period started.",
                SUPER_ADMIN_HREF);
        notificationService.notifyInstitution(
                saved.getId(),
                "Your license is in a grace period",
                "Your institution's license is in a grace period until renewed. Access will be suspended after "
                        + graceDays + " days unless renewed.",
                null);
        return InstitutionResponse.from(saved);
    }

    /** Transitions GRACE_PERIOD or SUSPENDED back to ACTIVE, clearing the grace deadline. */
    public InstitutionResponse renewLicense(String id, String actorId, RenewLicenseRequest request) {
        Institution institution = requireInstitution(id);

        institution.setLicenseStatus("ACTIVE");
        institution.setGraceEndsAt(null);
        Institution saved = repository.save(institution);

        recordLicenseEvent(saved.getId(), "RENEWED", request.reason(), actorId, null);

        notificationService.notifyPlatform(
                "Institution license renewed",
                saved.getName() + "'s license was renewed.",
                SUPER_ADMIN_HREF);
        notificationService.notifyInstitution(
                saved.getId(),
                "Your license was renewed",
                "Your institution's license is active again.",
                null);
        return InstitutionResponse.from(saved);
    }

    /**
     * Transitions directly to SUSPENDED, from any current licenseStatus,
     * with no grace window — the manual, immediate-cutoff counterpart to
     * start-grace-period, for severe cases (fraud, etc.) where giving
     * notice first isn't appropriate. actorId here is the calling super
     * admin's real id, distinguishing this event from the automated
     * sweep's own SUSPENDED events (actorId "SYSTEM").
     */
    public InstitutionResponse suspendLicense(String id, String actorId, SuspendLicenseRequest request) {
        Institution institution = requireInstitution(id);

        institution.setLicenseStatus("SUSPENDED");
        institution.setGraceEndsAt(null);
        Institution saved = repository.save(institution);

        recordLicenseEvent(saved.getId(), "SUSPENDED", request.reason(), actorId, null);

        notificationService.notifyPlatform(
                "Institution license suspended",
                saved.getName() + "'s license was suspended immediately.",
                SUPER_ADMIN_HREF);
        notificationService.notifyInstitution(
                saved.getId(),
                "Your license was suspended",
                "Your institution's license was suspended by the platform administrator.",
                null);
        return InstitutionResponse.from(saved);
    }

    public List<InstitutionLicenseEventResponse> listLicenseEvents(String id) {
        requireInstitution(id);
        return licenseEventRepository.findByInstitutionIdOrderByCreatedAtDesc(id).stream()
                .map(InstitutionLicenseEventResponse::from)
                .toList();
    }

    /**
     * Plain, directly-callable sweep logic invoked by LicenseSweepScheduler's
     * {@code @Scheduled} method — kept here so the JUnit suite can call and
     * assert on it directly without waiting on real wall-clock time.
     */
    public int sweepExpiredGracePeriods() {
        List<Institution> expired = repository.findByLicenseStatusAndGraceEndsAtBefore(
                "GRACE_PERIOD", Instant.now());

        for (Institution institution : expired) {
            institution.setLicenseStatus("SUSPENDED");
            institution.setGraceEndsAt(null);
            Institution saved = repository.save(institution);

            recordLicenseEvent(saved.getId(), "SUSPENDED", "Grace period expired.", SYSTEM_ACTOR, null);

            notificationService.notifyPlatform(
                    "Institution license suspended",
                    saved.getName() + "'s license was suspended after its grace period expired.",
                    SUPER_ADMIN_HREF);
            notificationService.notifyInstitution(
                    saved.getId(),
                    "Your license was suspended",
                    "Your institution's license grace period expired and access has been suspended.",
                    null);
        }
        return expired.size();
    }

    private void recordLicenseEvent(
            String institutionId, String eventType, String reason, String actorId, Instant graceEndsAtSnapshot) {
        licenseEventRepository.save(new InstitutionLicenseEvent(
                "license-event-" + UUID.randomUUID(),
                institutionId,
                eventType,
                reason,
                actorId,
                graceEndsAtSnapshot,
                Instant.now()));
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

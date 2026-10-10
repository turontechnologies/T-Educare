package com.teducare.role;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoleService {

    /**
     * Every real nav {@code key} a Role can grant — deliberately NOT
     * {@code ModuleCatalog.KEYS}. A nav item's {@code key} (what the
     * frontend's Role menu-access picker actually sends, see
     * {@code menu-access-tree.tsx}) and its {@code moduleKey} (what the
     * super-admin's Modules catalog gates) are two different string
     * spaces in {@code frontend/src/config/nav.ts}'s
     * {@code INSTITUTION_NAV} — they only coincidentally match for some
     * items (e.g. "students") and genuinely differ for others (e.g. the
     * Lecture Management item is {@code key: "lectures"} but
     * {@code moduleKey: "lecturer"}; nested items like
     * "academics.sessions" vs. "academic-sessions" differ by
     * construction). Reusing {@code ModuleCatalog.KEYS} here was a real
     * bug — any role granting access to a nested Academics/Staff item, or
     * to Lecture Management/Financials/Hostel Management (whose key and
     * moduleKey are unrelated words), was rejected with "Unknown menu
     * key". This list is every {@code key} value in {@code INSTITUTION_NAV},
     * flattened (parents and children both, since the picker lets either
     * be toggled) — keep it in sync with that file by hand, the same
     * discipline {@code ModuleCatalog}'s own doc comment asks for on the
     * moduleKey side.
     */
    private static final Set<String> VALID_MENU_KEYS = Set.of(
            "dashboard",
            "registration",
            "academics",
            "academics.sessions",
            "academics.schools",
            "academics.faculties",
            "academics.departments",
            "academics.programs",
            "academics.program-levels",
            "academics.course-grades",
            "academics.courses",
            "students",
            "staff",
            "staff.designation",
            "staff.all",
            "user-management",
            "lectures",
            "financials",
            "results",
            "hostel",
            "transport",
            "announcements",
            "notifications",
            "requests",
            "support");

    private final RoleRepository repository;

    public RoleService(RoleRepository repository) {
        this.repository = repository;
    }

    public List<RoleResponse> list(String institutionId) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .map(RoleResponse::from)
                .toList();
    }

    public RoleResponse create(String institutionId, CreateRoleRequest request) {
        if (repository.existsByInstitutionIdAndNameIgnoreCaseAndArchivedAtIsNull(institutionId, request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A role with that name already exists.");
        }
        validateMenuKeys(request.menuKeys());

        Role role = new Role(
                "role-" + UUID.randomUUID(),
                institutionId,
                request.name(),
                request.description(),
                String.join(",", request.menuKeys()),
                Instant.now(),
                null);
        return RoleResponse.from(repository.save(role));
    }

    public RoleResponse update(String institutionId, String id, UpdateRoleRequest request) {
        Role role = requireOwnRole(institutionId, id);

        if (isPresent(request.name()) && !request.name().equalsIgnoreCase(role.getName())
                && repository.existsByInstitutionIdAndNameIgnoreCaseAndArchivedAtIsNull(
                        institutionId, request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A role with that name already exists.");
        }
        if (isPresent(request.name())) {
            role.setName(request.name());
        }
        if (request.description() != null) {
            role.setDescription(request.description());
        }
        if (request.menuKeys() != null) {
            validateMenuKeys(request.menuKeys());
            role.setMenuKeys(String.join(",", request.menuKeys()));
        }

        return RoleResponse.from(repository.save(role));
    }

    public RoleResponse archive(String institutionId, String id) {
        Role role = requireOwnRole(institutionId, id);
        role.setArchivedAt(Instant.now());
        return RoleResponse.from(repository.save(role));
    }

    public RoleResponse restore(String institutionId, String id) {
        Role role = requireOwnRole(institutionId, id);
        role.setArchivedAt(null);
        return RoleResponse.from(repository.save(role));
    }

    /** Never leaks whether a role exists in a different institution — a mismatch reads identically to "not found". */
    private Role requireOwnRole(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found."));
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private static void validateMenuKeys(List<String> menuKeys) {
        if (menuKeys.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select at least one menu item.");
        }
        for (String key : menuKeys) {
            if (!VALID_MENU_KEYS.contains(key)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown menu key: " + key);
            }
        }
    }
}

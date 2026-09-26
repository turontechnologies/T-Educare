package com.teducare.role;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.module.ModuleCatalog;

@Service
public class RoleService {

    /** Every real nav key a Role can grant — ModuleCatalog's own set plus "dashboard", the one nav item deliberately excluded from that catalog since it's always reachable regardless of any role/module gating. */
    private static final Set<String> VALID_MENU_KEYS = concat(ModuleCatalog.KEYS, "dashboard");

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

    private static Set<String> concat(Set<String> keys, String extra) {
        return Stream.concat(keys.stream(), Stream.of(extra)).collect(Collectors.toUnmodifiableSet());
    }
}

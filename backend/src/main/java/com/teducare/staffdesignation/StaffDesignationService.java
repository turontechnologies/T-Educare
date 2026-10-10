package com.teducare.staffdesignation;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StaffDesignationService {

    private static final Set<String> CATEGORIES = Set.of("Academic Staff", "Non-Academic Staff");

    private final StaffDesignationRepository repository;

    public StaffDesignationService(StaffDesignationRepository repository) {
        this.repository = repository;
    }

    public List<StaffDesignationResponse> list(String institutionId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(d -> includeArchived || d.getArchivedAt() == null)
                .map(StaffDesignationResponse::from)
                .toList();
    }

    public StaffDesignationResponse create(String institutionId, CreateStaffDesignationRequest request) {
        validateCategory(request.category());
        validateUniqueName(institutionId, request.name(), null);

        StaffDesignation designation = new StaffDesignation(
                "staffdesig-" + UUID.randomUUID(),
                institutionId,
                request.name(),
                request.description(),
                request.category(),
                Instant.now(),
                null);
        return StaffDesignationResponse.from(repository.save(designation));
    }

    public StaffDesignationResponse update(String institutionId, String id, UpdateStaffDesignationRequest request) {
        StaffDesignation designation = requireOwnStaffDesignation(institutionId, id);

        if (isPresent(request.name())) {
            validateUniqueName(institutionId, request.name(), id);
            designation.setName(request.name());
        }
        if (request.description() != null) {
            designation.setDescription(request.description());
        }
        if (isPresent(request.category())) {
            validateCategory(request.category());
            designation.setCategory(request.category());
        }

        return StaffDesignationResponse.from(repository.save(designation));
    }

    public StaffDesignationResponse archive(String institutionId, String id) {
        StaffDesignation designation = requireOwnStaffDesignation(institutionId, id);
        designation.setArchivedAt(Instant.now());
        return StaffDesignationResponse.from(repository.save(designation));
    }

    public StaffDesignationResponse restore(String institutionId, String id) {
        StaffDesignation designation = requireOwnStaffDesignation(institutionId, id);
        designation.setArchivedAt(null);
        return StaffDesignationResponse.from(repository.save(designation));
    }

    /** Public — reused by StaffMemberService to validate a StaffMember's roleId/designationId FKs, same promotion pattern as every other sibling-service guard in this hierarchy. */
    public StaffDesignation requireOwnStaffDesignation(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff designation not found."));
    }

    private void validateCategory(String category) {
        if (!CATEGORIES.contains(category)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "category must be Academic Staff or Non-Academic Staff.");
        }
    }

    private void validateUniqueName(String institutionId, String name, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getName().equalsIgnoreCase(name));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A designation with that name already exists.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}

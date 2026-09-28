package com.teducare.school;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SchoolService {

    private final SchoolRepository repository;

    public SchoolService(SchoolRepository repository) {
        this.repository = repository;
    }

    public List<SchoolResponse> list(String institutionId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(school -> includeArchived || school.getArchivedAt() == null)
                .map(SchoolResponse::from)
                .toList();
    }

    public SchoolResponse create(String institutionId, CreateSchoolRequest request) {
        validateUniqueName(institutionId, request.name(), null);

        School school = new School(
                "school-" + UUID.randomUUID(),
                institutionId,
                request.name(),
                request.headName(),
                request.designation(),
                Instant.now(),
                null);
        return SchoolResponse.from(repository.save(school));
    }

    public SchoolResponse update(String institutionId, String id, UpdateSchoolRequest request) {
        School school = requireOwnSchool(institutionId, id);

        if (isPresent(request.name())) {
            validateUniqueName(institutionId, request.name(), id);
            school.setName(request.name());
        }
        if (isPresent(request.headName())) {
            school.setHeadName(request.headName());
        }
        if (isPresent(request.designation())) {
            school.setDesignation(request.designation());
        }

        return SchoolResponse.from(repository.save(school));
    }

    public SchoolResponse archive(String institutionId, String id) {
        School school = requireOwnSchool(institutionId, id);
        school.setArchivedAt(Instant.now());
        return SchoolResponse.from(repository.save(school));
    }

    public SchoolResponse restore(String institutionId, String id) {
        School school = requireOwnSchool(institutionId, id);
        school.setArchivedAt(null);
        return SchoolResponse.from(repository.save(school));
    }

    /**
     * Never leaks whether a school exists in a different institution — a
     * mismatch reads identically to "not found". Public (not
     * package-private, unlike academics' sibling-service pattern) since
     * this is called cross-package by any resource that FKs to a school —
     * Faculties (com.teducare.faculty) first, Departments/Courses next.
     */
    public School requireOwnSchool(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found."));
    }

    private void validateUniqueName(String institutionId, String name, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getName().equalsIgnoreCase(name));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A school with that name already exists.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}

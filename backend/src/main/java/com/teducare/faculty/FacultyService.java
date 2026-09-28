package com.teducare.faculty;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.school.SchoolService;

@Service
public class FacultyService {

    private final FacultyRepository repository;
    private final SchoolService schoolService;

    public FacultyService(FacultyRepository repository, SchoolService schoolService) {
        this.repository = repository;
        this.schoolService = schoolService;
    }

    public List<FacultyResponse> list(String institutionId, String schoolId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(faculty -> includeArchived || faculty.getArchivedAt() == null)
                .filter(faculty -> schoolId == null || schoolId.isBlank() || schoolId.equals(faculty.getSchoolId()))
                .map(FacultyResponse::from)
                .toList();
    }

    public FacultyResponse create(String institutionId, CreateFacultyRequest request) {
        // Reuses the school guard so a faculty can never be created against
        // another institution's school, even by guessing a real id.
        schoolService.requireOwnSchool(institutionId, request.schoolId());
        validateUniqueName(institutionId, request.name(), null);

        Faculty faculty = new Faculty(
                "faculty-" + UUID.randomUUID(),
                institutionId,
                request.name(),
                request.deanName(),
                request.schoolId(),
                Instant.now(),
                null);
        return FacultyResponse.from(repository.save(faculty));
    }

    public FacultyResponse update(String institutionId, String id, UpdateFacultyRequest request) {
        Faculty faculty = requireOwnFaculty(institutionId, id);

        if (isPresent(request.schoolId()) && !request.schoolId().equals(faculty.getSchoolId())) {
            // Reuses the school guard so a faculty can never be reassigned to
            // another institution's school, even by guessing a real id.
            schoolService.requireOwnSchool(institutionId, request.schoolId());
            faculty.setSchoolId(request.schoolId());
        }
        if (isPresent(request.name())) {
            validateUniqueName(institutionId, request.name(), id);
            faculty.setName(request.name());
        }
        if (isPresent(request.deanName())) {
            faculty.setDeanName(request.deanName());
        }

        return FacultyResponse.from(repository.save(faculty));
    }

    public FacultyResponse archive(String institutionId, String id) {
        Faculty faculty = requireOwnFaculty(institutionId, id);
        faculty.setArchivedAt(Instant.now());
        return FacultyResponse.from(repository.save(faculty));
    }

    public FacultyResponse restore(String institutionId, String id) {
        Faculty faculty = requireOwnFaculty(institutionId, id);
        faculty.setArchivedAt(null);
        return FacultyResponse.from(repository.save(faculty));
    }

    /** Never leaks whether a faculty exists in a different institution — a mismatch reads identically to "not found". */
    private Faculty requireOwnFaculty(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Faculty not found."));
    }

    private void validateUniqueName(String institutionId, String name, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getName().equalsIgnoreCase(name));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A faculty with that name already exists.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}

package com.teducare.department;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.faculty.FacultyService;
import com.teducare.school.SchoolService;

@Service
public class DepartmentService {

    private final DepartmentRepository repository;
    private final FacultyService facultyService;
    private final SchoolService schoolService;

    public DepartmentService(DepartmentRepository repository, FacultyService facultyService, SchoolService schoolService) {
        this.repository = repository;
        this.facultyService = facultyService;
        this.schoolService = schoolService;
    }

    public List<DepartmentResponse> list(
            String institutionId, String facultyId, String schoolId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(department -> includeArchived || department.getArchivedAt() == null)
                .filter(department -> facultyId == null || facultyId.isBlank()
                        || facultyId.equals(department.getFacultyId()))
                .filter(department -> schoolId == null || schoolId.isBlank()
                        || schoolId.equals(department.getSchoolId()))
                .map(DepartmentResponse::from)
                .toList();
    }

    public DepartmentResponse create(String institutionId, CreateDepartmentRequest request) {
        // Faculty and school are validated independently — this resource
        // does not derive one through the other (API_CONTRACT.md §7.6).
        facultyService.requireOwnFaculty(institutionId, request.facultyId());
        schoolService.requireOwnSchool(institutionId, request.schoolId());
        validateUniqueName(institutionId, request.name(), null);

        Department department = new Department(
                "department-" + UUID.randomUUID(),
                institutionId,
                request.name(),
                request.hodName(),
                request.facultyId(),
                request.schoolId(),
                Instant.now(),
                null);
        return DepartmentResponse.from(repository.save(department));
    }

    public DepartmentResponse update(String institutionId, String id, UpdateDepartmentRequest request) {
        Department department = requireOwnDepartment(institutionId, id);

        if (isPresent(request.facultyId()) && !request.facultyId().equals(department.getFacultyId())) {
            facultyService.requireOwnFaculty(institutionId, request.facultyId());
            department.setFacultyId(request.facultyId());
        }
        if (isPresent(request.schoolId()) && !request.schoolId().equals(department.getSchoolId())) {
            schoolService.requireOwnSchool(institutionId, request.schoolId());
            department.setSchoolId(request.schoolId());
        }
        if (isPresent(request.name())) {
            validateUniqueName(institutionId, request.name(), id);
            department.setName(request.name());
        }
        if (isPresent(request.hodName())) {
            department.setHodName(request.hodName());
        }

        return DepartmentResponse.from(repository.save(department));
    }

    public DepartmentResponse archive(String institutionId, String id) {
        Department department = requireOwnDepartment(institutionId, id);
        department.setArchivedAt(Instant.now());
        return DepartmentResponse.from(repository.save(department));
    }

    public DepartmentResponse restore(String institutionId, String id) {
        Department department = requireOwnDepartment(institutionId, id);
        department.setArchivedAt(null);
        return DepartmentResponse.from(repository.save(department));
    }

    /** Never leaks whether a department exists in a different institution — a mismatch reads identically to "not found". */
    private Department requireOwnDepartment(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found."));
    }

    private void validateUniqueName(String institutionId, String name, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getName().equalsIgnoreCase(name));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A department with that name already exists.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}

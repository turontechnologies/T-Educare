package com.teducare.program;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.department.DepartmentService;
import com.teducare.faculty.FacultyService;

@Service
public class ProgramService {

    private static final Set<String> VALID_PROGRAM_TYPES = Set.of("Undergraduate", "Postgraduate");

    private final ProgramRepository repository;
    private final DepartmentService departmentService;
    private final FacultyService facultyService;

    public ProgramService(ProgramRepository repository, DepartmentService departmentService, FacultyService facultyService) {
        this.repository = repository;
        this.departmentService = departmentService;
        this.facultyService = facultyService;
    }

    public List<ProgramResponse> list(
            String institutionId, String departmentId, String facultyId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(program -> includeArchived || program.getArchivedAt() == null)
                .filter(program -> departmentId == null || departmentId.isBlank()
                        || departmentId.equals(program.getDepartmentId()))
                .filter(program -> facultyId == null || facultyId.isBlank()
                        || facultyId.equals(program.getFacultyId()))
                .map(ProgramResponse::from)
                .toList();
    }

    public ProgramResponse create(String institutionId, CreateProgramRequest request) {
        // Department and faculty are validated independently — this
        // resource does not derive one through the other (API_CONTRACT.md §7.7).
        departmentService.requireOwnDepartment(institutionId, request.departmentId());
        facultyService.requireOwnFaculty(institutionId, request.facultyId());
        validateProgramType(request.programType());
        validateUniqueName(institutionId, request.name(), null);

        Program program = new Program(
                "program-" + UUID.randomUUID(),
                institutionId,
                request.name(),
                request.departmentId(),
                request.facultyId(),
                request.programType(),
                Instant.now(),
                null);
        return ProgramResponse.from(repository.save(program));
    }

    public ProgramResponse update(String institutionId, String id, UpdateProgramRequest request) {
        Program program = requireOwnProgram(institutionId, id);

        if (isPresent(request.departmentId()) && !request.departmentId().equals(program.getDepartmentId())) {
            departmentService.requireOwnDepartment(institutionId, request.departmentId());
            program.setDepartmentId(request.departmentId());
        }
        if (isPresent(request.facultyId()) && !request.facultyId().equals(program.getFacultyId())) {
            facultyService.requireOwnFaculty(institutionId, request.facultyId());
            program.setFacultyId(request.facultyId());
        }
        if (isPresent(request.programType())) {
            validateProgramType(request.programType());
            program.setProgramType(request.programType());
        }
        if (isPresent(request.name())) {
            validateUniqueName(institutionId, request.name(), id);
            program.setName(request.name());
        }

        return ProgramResponse.from(repository.save(program));
    }

    public ProgramResponse archive(String institutionId, String id) {
        Program program = requireOwnProgram(institutionId, id);
        program.setArchivedAt(Instant.now());
        return ProgramResponse.from(repository.save(program));
    }

    public ProgramResponse restore(String institutionId, String id) {
        Program program = requireOwnProgram(institutionId, id);
        program.setArchivedAt(null);
        return ProgramResponse.from(repository.save(program));
    }

    /** Never leaks whether a program exists in a different institution — a mismatch reads identically to "not found". Public — reused cross-package by StudentService, same promotion pattern as every other sibling-service guard in this hierarchy. */
    public Program requireOwnProgram(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program not found."));
    }

    private void validateUniqueName(String institutionId, String name, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getName().equalsIgnoreCase(name));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A program with that name already exists.");
        }
    }

    private static void validateProgramType(String programType) {
        if (!VALID_PROGRAM_TYPES.contains(programType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Program type must be Undergraduate or Postgraduate.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}

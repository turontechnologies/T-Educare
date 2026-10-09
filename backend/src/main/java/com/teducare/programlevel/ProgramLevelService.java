package com.teducare.programlevel;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProgramLevelService {

    private final ProgramLevelRepository repository;

    public ProgramLevelService(ProgramLevelRepository repository) {
        this.repository = repository;
    }

    public List<ProgramLevelResponse> list(String institutionId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .filter(level -> includeArchived || level.getArchivedAt() == null)
                .map(ProgramLevelResponse::from)
                .toList();
    }

    public ProgramLevelResponse create(String institutionId, CreateProgramLevelRequest request) {
        validateUniqueLevelCode(institutionId, request.levelCode(), null);

        ProgramLevel level = new ProgramLevel(
                "program-level-" + UUID.randomUUID(),
                institutionId,
                request.levelCode(),
                request.description(),
                Instant.now(),
                null);
        return ProgramLevelResponse.from(repository.save(level));
    }

    public ProgramLevelResponse update(String institutionId, String id, UpdateProgramLevelRequest request) {
        ProgramLevel level = requireOwnProgramLevel(institutionId, id);

        if (isPresent(request.levelCode())) {
            validateUniqueLevelCode(institutionId, request.levelCode(), id);
            level.setLevelCode(request.levelCode());
        }
        if (isPresent(request.description())) {
            level.setDescription(request.description());
        }

        return ProgramLevelResponse.from(repository.save(level));
    }

    public ProgramLevelResponse archive(String institutionId, String id) {
        ProgramLevel level = requireOwnProgramLevel(institutionId, id);
        level.setArchivedAt(Instant.now());
        return ProgramLevelResponse.from(repository.save(level));
    }

    public ProgramLevelResponse restore(String institutionId, String id) {
        ProgramLevel level = requireOwnProgramLevel(institutionId, id);
        level.setArchivedAt(null);
        return ProgramLevelResponse.from(repository.save(level));
    }

    /** Never leaks whether a program level exists in a different institution — a mismatch reads identically to "not found". Public — reused cross-package by CourseService/StudentService (and, soon, course registration) the same way SchoolService/FacultyService/DepartmentService's own guards were promoted. */
    public ProgramLevel requireOwnProgramLevel(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Program level not found."));
    }

    private void validateUniqueLevelCode(String institutionId, String levelCode, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByCreatedAtAsc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getLevelCode().equalsIgnoreCase(levelCode));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A program level with that code already exists.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}

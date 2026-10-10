package com.teducare.academics;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AcademicSemesterService {

    private final AcademicSemesterRepository repository;
    private final AcademicSessionService sessionService;

    public AcademicSemesterService(AcademicSemesterRepository repository, AcademicSessionService sessionService) {
        this.repository = repository;
        this.sessionService = sessionService;
    }

    public List<AcademicSemesterResponse> list(String institutionId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByFromDesc(institutionId).stream()
                .filter(semester -> includeArchived || semester.getArchivedAt() == null)
                .map(AcademicSemesterResponse::from)
                .toList();
    }

    public AcademicSemesterResponse create(String institutionId, CreateAcademicSemesterRequest request) {
        // Reuses the session guard so a semester can never be created against
        // another institution's session, even by guessing a real id.
        sessionService.requireOwnSession(institutionId, request.sessionId());
        validateDateRange(request.from(), request.to());

        AcademicSemester semester = new AcademicSemester(
                "semester-" + UUID.randomUUID(),
                institutionId,
                request.sessionId(),
                request.name(),
                request.semesterNumber(),
                request.description(),
                request.from(),
                request.to(),
                request.status() == null || request.status().isBlank() ? "upcoming" : request.status(),
                false,
                Instant.now(),
                null);
        return AcademicSemesterResponse.from(repository.save(semester));
    }

    public AcademicSemesterResponse update(String institutionId, String id, UpdateAcademicSemesterRequest request) {
        AcademicSemester semester = requireOwnSemester(institutionId, id);

        if (isPresent(request.sessionId()) && !request.sessionId().equals(semester.getSessionId())) {
            // Reuses the session guard so a semester can never be reassigned
            // to another institution's session, even by guessing a real id.
            sessionService.requireOwnSession(institutionId, request.sessionId());
            semester.setSessionId(request.sessionId());
        }

        Instant newFrom = request.from() != null ? request.from() : semester.getFrom();
        Instant newTo = request.to() != null ? request.to() : semester.getTo();
        validateDateRange(newFrom, newTo);

        if (isPresent(request.name())) {
            semester.setName(request.name());
        }
        if (request.semesterNumber() != null) {
            if (request.semesterNumber() < 1 || request.semesterNumber() > 2) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Semester number must be 1 or 2.");
            }
            semester.setSemesterNumber(request.semesterNumber());
        }
        if (request.description() != null) {
            semester.setDescription(request.description());
        }
        semester.setFrom(newFrom);
        semester.setTo(newTo);
        if (isPresent(request.status())) {
            semester.setStatus(request.status());
        }

        return AcademicSemesterResponse.from(repository.save(semester));
    }

    public AcademicSemesterResponse archive(String institutionId, String id) {
        AcademicSemester semester = requireOwnSemester(institutionId, id);
        semester.setArchivedAt(Instant.now());
        return AcademicSemesterResponse.from(repository.save(semester));
    }

    public AcademicSemesterResponse restore(String institutionId, String id) {
        AcademicSemester semester = requireOwnSemester(institutionId, id);
        semester.setArchivedAt(null);
        return AcademicSemesterResponse.from(repository.save(semester));
    }

    /** Never more than one current semester *within the same session* — setting one never touches a semester belonging to a different session (API_CONTRACT.md §7.1). */
    @Transactional
    public AcademicSemesterResponse setCurrent(String institutionId, String id) {
        AcademicSemester target = requireOwnSemester(institutionId, id);

        for (AcademicSemester sibling : repository.findBySessionId(target.getSessionId())) {
            if (!sibling.getId().equals(id) && sibling.isCurrent()) {
                sibling.setCurrent(false);
                repository.save(sibling);
            }
        }

        target.setCurrent(true);
        if ("upcoming".equals(target.getStatus())) {
            target.setStatus("active");
        }
        return AcademicSemesterResponse.from(repository.save(target));
    }

    public AcademicSemesterResponse close(String institutionId, String id) {
        AcademicSemester semester = requireOwnSemester(institutionId, id);
        semester.setStatus("completed");
        semester.setCurrent(false);
        return AcademicSemesterResponse.from(repository.save(semester));
    }

    /** Public — reused cross-package by CourseRegistrationService, same promotion pattern as every other sibling-service guard in this hierarchy. */
    public AcademicSemester requireOwnSemester(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic semester not found."));
    }

    private void validateDateRange(Instant from, Instant to) {
        if (from != null && to != null && !to.isAfter(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be after the start date.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}

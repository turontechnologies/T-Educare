package com.teducare.academics;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AcademicSessionService {

    private final AcademicSessionRepository repository;

    public AcademicSessionService(AcademicSessionRepository repository) {
        this.repository = repository;
    }

    public List<AcademicSessionResponse> list(String institutionId, boolean includeArchived) {
        return repository.findByInstitutionIdOrderByFromDesc(institutionId).stream()
                .filter(session -> includeArchived || session.getArchivedAt() == null)
                .map(AcademicSessionResponse::from)
                .toList();
    }

    public AcademicSessionResponse create(String institutionId, CreateAcademicSessionRequest request) {
        validateDateRange(request.from(), request.to());
        validateUniqueName(institutionId, request.session(), null);

        AcademicSession session = new AcademicSession(
                "session-" + UUID.randomUUID(),
                institutionId,
                request.session(),
                request.from(),
                request.to(),
                request.status() == null || request.status().isBlank() ? "upcoming" : request.status(),
                false,
                Instant.now(),
                null);
        return AcademicSessionResponse.from(repository.save(session));
    }

    public AcademicSessionResponse update(String institutionId, String id, UpdateAcademicSessionRequest request) {
        AcademicSession session = requireOwnSession(institutionId, id);

        Instant newFrom = request.from() != null ? request.from() : session.getFrom();
        Instant newTo = request.to() != null ? request.to() : session.getTo();
        validateDateRange(newFrom, newTo);

        if (isPresent(request.session())) {
            validateUniqueName(institutionId, request.session(), id);
            session.setSession(request.session());
        }
        session.setFrom(newFrom);
        session.setTo(newTo);
        if (isPresent(request.status())) {
            session.setStatus(request.status());
        }

        return AcademicSessionResponse.from(repository.save(session));
    }

    public AcademicSessionResponse archive(String institutionId, String id) {
        AcademicSession session = requireOwnSession(institutionId, id);
        session.setArchivedAt(Instant.now());
        return AcademicSessionResponse.from(repository.save(session));
    }

    public AcademicSessionResponse restore(String institutionId, String id) {
        AcademicSession session = requireOwnSession(institutionId, id);
        session.setArchivedAt(null);
        return AcademicSessionResponse.from(repository.save(session));
    }

    /** Never more than one current session per institution at a time — API_CONTRACT.md §7.1. */
    @Transactional
    public AcademicSessionResponse setCurrent(String institutionId, String id) {
        AcademicSession target = requireOwnSession(institutionId, id);

        for (AcademicSession other : repository.findByInstitutionIdOrderByFromDesc(institutionId)) {
            if (!other.getId().equals(id) && other.isCurrent()) {
                other.setCurrent(false);
                repository.save(other);
            }
        }

        target.setCurrent(true);
        if ("upcoming".equals(target.getStatus())) {
            target.setStatus("active");
        }
        return AcademicSessionResponse.from(repository.save(target));
    }

    public AcademicSessionResponse close(String institutionId, String id) {
        AcademicSession session = requireOwnSession(institutionId, id);
        session.setStatus("completed");
        session.setCurrent(false);
        return AcademicSessionResponse.from(repository.save(session));
    }

    /** Never leaks whether a session exists in a different institution — a mismatch reads identically to "not found". Public — reused cross-package by StudentService/CourseRegistrationService, same promotion pattern as every other sibling-service guard in this hierarchy. */
    public AcademicSession requireOwnSession(String institutionId, String id) {
        return repository.findByIdAndInstitutionId(id, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic session not found."));
    }

    private void validateDateRange(Instant from, Instant to) {
        if (from != null && to != null && !to.isAfter(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be after the start date.");
        }
    }

    private void validateUniqueName(String institutionId, String session, String excludingId) {
        boolean collides = repository.findByInstitutionIdOrderByFromDesc(institutionId).stream()
                .anyMatch(existing -> existing.getArchivedAt() == null
                        && !existing.getId().equals(excludingId)
                        && existing.getSession().equalsIgnoreCase(session));
        if (collides) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A session with that name already exists.");
        }
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }
}

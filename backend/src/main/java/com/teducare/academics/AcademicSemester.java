package com.teducare.academics;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Belongs to exactly one {@link AcademicSession} via a real FK
 * ({@code sessionId}), not a denormalized name — API_CONTRACT.md §7. At
 * most one semester per session is ever {@code isCurrent}.
 */
@Entity
@Table(name = "academic_semesters", schema = "dbo")
public class AcademicSemester {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "session_id", nullable = false, length = 64)
    private String sessionId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * Which semester-of-the-year this is (1 or 2) — distinct from
     * {@code name}, which is free text an admin can type however they
     * like. {@link com.teducare.course.Course} carries the same number,
     * and {@link com.teducare.registration.CourseRegistrationService}
     * matches the two so a 2nd-semester course never shows up as
     * registrable in a 1st-semester instance, or vice versa — a course
     * list is NOT reused as-is across both halves of a session. Nullable
     * at the DB level only because a pre-existing semester row (created
     * before this field existed) has no sensible value to backfill with;
     * every create/update through {@link AcademicSemesterService} still
     * requires it.
     */
    @Column(name = "semester_number")
    private Integer semesterNumber;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "from_date", nullable = false)
    private Instant from;

    @Column(name = "to_date", nullable = false)
    private Instant to;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "is_current", nullable = false)
    private boolean isCurrent;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected AcademicSemester() {
    }

    public AcademicSemester(
            String id,
            String institutionId,
            String sessionId,
            String name,
            Integer semesterNumber,
            String description,
            Instant from,
            Instant to,
            String status,
            boolean isCurrent,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.sessionId = sessionId;
        this.name = name;
        this.semesterNumber = semesterNumber;
        this.description = description;
        this.from = from;
        this.to = to;
        this.status = status;
        this.isCurrent = isCurrent;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getSemesterNumber() {
        return semesterNumber;
    }

    public void setSemesterNumber(Integer semesterNumber) {
        this.semesterNumber = semesterNumber;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getFrom() {
        return from;
    }

    public void setFrom(Instant from) {
        this.from = from;
    }

    public Instant getTo() {
        return to;
    }

    public void setTo(Instant to) {
        this.to = to;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isCurrent() {
        return isCurrent;
    }

    public void setCurrent(boolean current) {
        isCurrent = current;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getArchivedAt() {
        return archivedAt;
    }

    public void setArchivedAt(Instant archivedAt) {
        this.archivedAt = archivedAt;
    }
}

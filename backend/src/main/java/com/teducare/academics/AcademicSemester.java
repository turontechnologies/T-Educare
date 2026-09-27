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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

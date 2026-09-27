package com.teducare.academics;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * An institution-scoped academic year (e.g. "2026/2027"). At most one
 * session per institution is ever {@code isCurrent} — API_CONTRACT.md §7.1.
 */
@Entity
@Table(name = "academic_sessions", schema = "dbo")
public class AcademicSession {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "session", nullable = false, length = 20)
    private String session;

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

    protected AcademicSession() {
    }

    public AcademicSession(
            String id,
            String institutionId,
            String session,
            Instant from,
            Instant to,
            String status,
            boolean isCurrent,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.session = session;
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

    public String getSession() {
        return session;
    }

    public void setSession(String session) {
        this.session = session;
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

package com.teducare.institution;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Append-only audit log of license-status transitions — a lightweight
 * history alongside the institution's own cached {@code licenseStatus}/
 * {@code graceEndsAt}, never the source of current state (see
 * {@code Student.academicHistory} for the same "cached current value +
 * append-only immutable history" shape already established elsewhere in
 * this codebase).
 */
@Entity
@Table(name = "institution_license_events", schema = "dbo")
public class InstitutionLicenseEvent {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    /** "GRACE_STARTED"/"SUSPENDED"/"RENEWED". */
    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @Column(name = "reason", length = 500)
    private String reason;

    /** The calling super admin's id, or "SYSTEM" for the automated sweep. */
    @Column(name = "actor_id", length = 64)
    private String actorId;

    @Column(name = "grace_ends_at_snapshot")
    private Instant graceEndsAtSnapshot;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected InstitutionLicenseEvent() {
    }

    public InstitutionLicenseEvent(
            String id,
            String institutionId,
            String eventType,
            String reason,
            String actorId,
            Instant graceEndsAtSnapshot,
            Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.eventType = eventType;
        this.reason = reason;
        this.actorId = actorId;
        this.graceEndsAtSnapshot = graceEndsAtSnapshot;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getEventType() {
        return eventType;
    }

    public String getReason() {
        return reason;
    }

    public String getActorId() {
        return actorId;
    }

    public Instant getGraceEndsAtSnapshot() {
        return graceEndsAtSnapshot;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

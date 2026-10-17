package com.teducare.attendance;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A registered biometric clock-in machine (or its middleware) — authenticates its clock-event pushes with its own API key, never an institution_admin login. */
@Entity
@Table(name = "attendance_devices", schema = "dbo")
public class AttendanceDevice {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "location", length = 150)
    private String location;

    /** BCrypt hash — the plaintext key is returned to the caller exactly once, at creation. */
    @Column(name = "api_key_hash", nullable = false)
    private String apiKeyHash;

    /** "active" | "revoked". */
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "last_seen_at")
    private Instant lastSeenAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    protected AttendanceDevice() {
    }

    public AttendanceDevice(
            String id,
            String institutionId,
            String name,
            String location,
            String apiKeyHash,
            String status,
            Instant lastSeenAt,
            Instant createdAt,
            Instant revokedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.name = name;
        this.location = location;
        this.apiKeyHash = apiKeyHash;
        this.status = status;
        this.lastSeenAt = lastSeenAt;
        this.createdAt = createdAt;
        this.revokedAt = revokedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getApiKeyHash() {
        return apiKeyHash;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }

    public void setLastSeenAt(Instant lastSeenAt) {
        this.lastSeenAt = lastSeenAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(Instant revokedAt) {
        this.revokedAt = revokedAt;
    }
}

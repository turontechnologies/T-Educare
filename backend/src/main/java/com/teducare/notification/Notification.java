package com.teducare.notification;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications", schema = "dbo")
public class Notification {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    /** Nullable — where clicking it navigates. Never crosses into the other role's area (super_admin hrefs start with /super-admin, everything else with /dashboard). */
    @Column(name = "href")
    private String href;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    /** "platform" | "institution" | "user" — see API_CONTRACT.md §10.1. */
    @Column(name = "scope_type", nullable = false, length = 20)
    private String scopeType;

    @Column(name = "scope_institution_id", length = 64)
    private String scopeInstitutionId;

    @Column(name = "scope_user_id", length = 64)
    private String scopeUserId;

    protected Notification() {
    }

    public Notification(
            String id,
            String title,
            String message,
            String href,
            Instant createdAt,
            boolean read,
            String scopeType,
            String scopeInstitutionId,
            String scopeUserId) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.href = href;
        this.createdAt = createdAt;
        this.read = read;
        this.scopeType = scopeType;
        this.scopeInstitutionId = scopeInstitutionId;
        this.scopeUserId = scopeUserId;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getHref() {
        return href;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public String getScopeType() {
        return scopeType;
    }

    public String getScopeInstitutionId() {
        return scopeInstitutionId;
    }

    public String getScopeUserId() {
        return scopeUserId;
    }
}

package com.teducare.announcement;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A school-wide/students/staff/hostel-residents broadcast. {@code
 * targetValue}'s meaning depends on {@code targetScope} (see {@link
 * TargetScope}): null/"ALL" for SCHOOL_WIDE and the "all X" options, a real
 * {@code ProgramLevel} id for a specific student level, "LECTURERS" for
 * just lecturers, or a real {@code Hostel} id for one hostel's residents —
 * resolved to a human label at read time via {@code AnnouncementService
 * .targetLabel}, never stored, same "never denormalize something
 * computable" rule used throughout this backend.
 *
 * <p>No actual delivery (push/email/in-app notification fan-out to every
 * targeted recipient) happens here — this module records and displays
 * what was announced to whom, matching the reference design's own scope;
 * wiring real delivery is a materially larger, separate feature.
 *
 * <p>{@code status} is DRAFT, SCHEDULED, or SENT. A SCHEDULED announcement
 * does **not** automatically flip to SENT when {@code scheduledFor}
 * passes — there is no background sweep, since nothing in the reference
 * design calls for one and no real delivery mechanism exists to trigger;
 * "Send now" (on a SCHEDULED or DRAFT row) is the only path to SENT.
 */
@Entity
@Table(name = "announcements", schema = "dbo")
public class Announcement {

    public static final String DRAFT = "DRAFT";
    public static final String SCHEDULED = "SCHEDULED";
    public static final String SENT = "SENT";

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "headline", nullable = false, length = 300)
    private String headline;

    @Column(name = "body", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String body;

    @Column(name = "send_via_app", nullable = false)
    private boolean sendViaApp;

    @Column(name = "send_via_email", nullable = false)
    private boolean sendViaEmail;

    @Column(name = "target_scope", nullable = false, length = 30)
    private String targetScope;

    @Column(name = "target_value", length = 64)
    private String targetValue;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "scheduled_for")
    private Instant scheduledFor;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "created_by_name", nullable = false, length = 200)
    private String createdByName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Announcement() {
    }

    public Announcement(
            String id,
            String institutionId,
            String headline,
            String body,
            boolean sendViaApp,
            boolean sendViaEmail,
            String targetScope,
            String targetValue,
            String status,
            Instant scheduledFor,
            Instant sentAt,
            String createdByName,
            Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.headline = headline;
        this.body = body;
        this.sendViaApp = sendViaApp;
        this.sendViaEmail = sendViaEmail;
        this.targetScope = targetScope;
        this.targetValue = targetValue;
        this.status = status;
        this.scheduledFor = scheduledFor;
        this.sentAt = sentAt;
        this.createdByName = createdByName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public boolean isSendViaApp() {
        return sendViaApp;
    }

    public void setSendViaApp(boolean sendViaApp) {
        this.sendViaApp = sendViaApp;
    }

    public boolean isSendViaEmail() {
        return sendViaEmail;
    }

    public void setSendViaEmail(boolean sendViaEmail) {
        this.sendViaEmail = sendViaEmail;
    }

    public String getTargetScope() {
        return targetScope;
    }

    public void setTargetScope(String targetScope) {
        this.targetScope = targetScope;
    }

    public String getTargetValue() {
        return targetValue;
    }

    public void setTargetValue(String targetValue) {
        this.targetValue = targetValue;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getScheduledFor() {
        return scheduledFor;
    }

    public void setScheduledFor(Instant scheduledFor) {
        this.scheduledFor = scheduledFor;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }

    public String getCreatedByName() {
        return createdByName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

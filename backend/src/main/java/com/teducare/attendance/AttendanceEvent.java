package com.teducare.attendance;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One raw clock-in/clock-out tap — append-only, the sole source of truth; daily PRESENT/LATE/ABSENT status is always derived from these at read time, never stored. */
@Entity
@Table(name = "attendance_events", schema = "dbo")
public class AttendanceEvent {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "staff_id", nullable = false, length = 64)
    private String staffId;

    /** "CLOCK_IN" | "CLOCK_OUT". */
    @Column(name = "event_type", nullable = false, length = 10)
    private String eventType;

    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    /** Null for a manual entry. */
    @Column(name = "device_id", length = 64)
    private String deviceId;

    /** "DEVICE" | "MANUAL". */
    @Column(name = "source", nullable = false, length = 10)
    private String source;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "recorded_by", length = 64)
    private String recordedBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected AttendanceEvent() {
    }

    public AttendanceEvent(
            String id,
            String institutionId,
            String staffId,
            String eventType,
            Instant occurredAt,
            String deviceId,
            String source,
            String note,
            String recordedBy,
            Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.staffId = staffId;
        this.eventType = eventType;
        this.occurredAt = occurredAt;
        this.deviceId = deviceId;
        this.source = source;
        this.note = note;
        this.recordedBy = recordedBy;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getStaffId() {
        return staffId;
    }

    public String getEventType() {
        return eventType;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public String getSource() {
        return source;
    }

    public String getNote() {
        return note;
    }

    public String getRecordedBy() {
        return recordedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

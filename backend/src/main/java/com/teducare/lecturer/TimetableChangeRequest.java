package com.teducare.lecturer;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A lecturer's own request to move one of their {@link TimetableSlot}s to a
 * different day/time/venue — append-only history of the request itself;
 * approving it is what actually edits the real slot (see
 * {@code LectureAssignmentService#resolveChangeRequest}).
 */
@Entity
@Table(name = "timetable_change_requests", schema = "dbo")
public class TimetableChangeRequest {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "timetable_slot_id", nullable = false, length = 64)
    private String timetableSlotId;

    @Column(name = "requested_by_lecturer_id", nullable = false, length = 64)
    private String requestedByLecturerId;

    @Column(name = "proposed_day_of_week", nullable = false, length = 10)
    private String proposedDayOfWeek;

    @Column(name = "proposed_start_time", nullable = false, length = 5)
    private String proposedStartTime;

    @Column(name = "proposed_end_time", nullable = false, length = 5)
    private String proposedEndTime;

    @Column(name = "proposed_venue", length = 100)
    private String proposedVenue;

    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    /** "PENDING" | "APPROVED" | "REJECTED". */
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected TimetableChangeRequest() {
    }

    public TimetableChangeRequest(
            String id,
            String institutionId,
            String timetableSlotId,
            String requestedByLecturerId,
            String proposedDayOfWeek,
            String proposedStartTime,
            String proposedEndTime,
            String proposedVenue,
            String reason,
            String status,
            Instant createdAt,
            Instant resolvedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.timetableSlotId = timetableSlotId;
        this.requestedByLecturerId = requestedByLecturerId;
        this.proposedDayOfWeek = proposedDayOfWeek;
        this.proposedStartTime = proposedStartTime;
        this.proposedEndTime = proposedEndTime;
        this.proposedVenue = proposedVenue;
        this.reason = reason;
        this.status = status;
        this.createdAt = createdAt;
        this.resolvedAt = resolvedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getTimetableSlotId() {
        return timetableSlotId;
    }

    public String getRequestedByLecturerId() {
        return requestedByLecturerId;
    }

    public String getProposedDayOfWeek() {
        return proposedDayOfWeek;
    }

    public String getProposedStartTime() {
        return proposedStartTime;
    }

    public String getProposedEndTime() {
        return proposedEndTime;
    }

    public String getProposedVenue() {
        return proposedVenue;
    }

    public String getReason() {
        return reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}

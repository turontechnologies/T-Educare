package com.teducare.leave;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A staff member's own leave request — one evolving record through its
 * whole lifecycle (PENDING -&gt; APPROVED/REJECTED/CANCELLED, then
 * optionally a resumption report once back), same shape as {@code
 * TimetableChangeRequest}, not the separate "cached value + immutable
 * history" shape used for disciplinary records, because the request itself
 * is the thing being tracked. An APPROVED request covering a given day is
 * what makes {@link com.teducare.attendance.AttendanceService} report
 * ON_LEAVE instead of ABSENT for that day.
 */
@Entity
@Table(name = "leave_requests", schema = "dbo")
public class LeaveRequest {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "staff_id", nullable = false, length = 64)
    private String staffId;

    @Column(name = "leave_type_id", nullable = false, length = 64)
    private String leaveTypeId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /** Workdays within [startDate, endDate], not a raw calendar-day count. */
    @Column(name = "total_days", nullable = false)
    private int totalDays;

    @Column(name = "reason", nullable = false, length = 1000)
    private String reason;

    /** "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED". */
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "reviewed_by", length = 64)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "review_note", length = 1000)
    private String reviewNote;

    @Column(name = "resumed_at")
    private Instant resumedAt;

    @Column(name = "resumption_note", length = 1000)
    private String resumptionNote;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected LeaveRequest() {
    }

    public LeaveRequest(
            String id,
            String institutionId,
            String staffId,
            String leaveTypeId,
            LocalDate startDate,
            LocalDate endDate,
            int totalDays,
            String reason,
            String status,
            String reviewedBy,
            Instant reviewedAt,
            String reviewNote,
            Instant resumedAt,
            String resumptionNote,
            Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.staffId = staffId;
        this.leaveTypeId = leaveTypeId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.totalDays = totalDays;
        this.reason = reason;
        this.status = status;
        this.reviewedBy = reviewedBy;
        this.reviewedAt = reviewedAt;
        this.reviewNote = reviewNote;
        this.resumedAt = resumedAt;
        this.resumptionNote = resumptionNote;
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

    public String getLeaveTypeId() {
        return leaveTypeId;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public int getTotalDays() {
        return totalDays;
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

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public void setReviewNote(String reviewNote) {
        this.reviewNote = reviewNote;
    }

    public Instant getResumedAt() {
        return resumedAt;
    }

    public void setResumedAt(Instant resumedAt) {
        this.resumedAt = resumedAt;
    }

    public String getResumptionNote() {
        return resumptionNote;
    }

    public void setResumptionNote(String resumptionNote) {
        this.resumptionNote = resumptionNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

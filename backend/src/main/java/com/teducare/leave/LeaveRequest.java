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
 * is the thing being tracked.
 *
 * <p>The resumption sub-flow is its own admin-approved cycle, not a plain
 * note: a staff member reports {@code resumptionDate} (their first day NOT
 * on leave), which only takes effect once admin approves it via {@code
 * resumptionStatus}. Until approved, {@link LeaveRequestService}'s
 * effective-end-date logic treats an APPROVED request with no approved
 * resumption as still ongoing past {@code endDate} if today has already
 * passed it — the "silence extends the leave and keeps deducting days"
 * rule — which is also what makes a late resumption report (submitted
 * after that auto-extension already started, carrying {@code
 * resumptionLateReason}) function as the appeal that corrects it.
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

    /** The staff member's claimed first day back at work — not yet in effect until resumptionStatus is "APPROVED". */
    @Column(name = "resumption_date")
    private LocalDate resumptionDate;

    @Column(name = "resumption_reported_at")
    private Instant resumptionReportedAt;

    @Column(name = "resumption_note", length = 1000)
    private String resumptionNote;

    /** Only present (and required by the service) when reported after endDate had already passed — the appeal's "why late" explanation. */
    @Column(name = "resumption_late_reason", length = 1000)
    private String resumptionLateReason;

    /** "PENDING" | "APPROVED" | "REJECTED" — null means nothing reported yet. */
    @Column(name = "resumption_status", length = 20)
    private String resumptionStatus;

    @Column(name = "resumption_reviewed_by", length = 64)
    private String resumptionReviewedBy;

    @Column(name = "resumption_reviewed_at")
    private Instant resumptionReviewedAt;

    @Column(name = "resumption_review_note", length = 1000)
    private String resumptionReviewNote;

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

    public LocalDate getResumptionDate() {
        return resumptionDate;
    }

    public void setResumptionDate(LocalDate resumptionDate) {
        this.resumptionDate = resumptionDate;
    }

    public Instant getResumptionReportedAt() {
        return resumptionReportedAt;
    }

    public void setResumptionReportedAt(Instant resumptionReportedAt) {
        this.resumptionReportedAt = resumptionReportedAt;
    }

    public String getResumptionNote() {
        return resumptionNote;
    }

    public void setResumptionNote(String resumptionNote) {
        this.resumptionNote = resumptionNote;
    }

    public String getResumptionLateReason() {
        return resumptionLateReason;
    }

    public void setResumptionLateReason(String resumptionLateReason) {
        this.resumptionLateReason = resumptionLateReason;
    }

    public String getResumptionStatus() {
        return resumptionStatus;
    }

    public void setResumptionStatus(String resumptionStatus) {
        this.resumptionStatus = resumptionStatus;
    }

    public String getResumptionReviewedBy() {
        return resumptionReviewedBy;
    }

    public void setResumptionReviewedBy(String resumptionReviewedBy) {
        this.resumptionReviewedBy = resumptionReviewedBy;
    }

    public Instant getResumptionReviewedAt() {
        return resumptionReviewedAt;
    }

    public void setResumptionReviewedAt(Instant resumptionReviewedAt) {
        this.resumptionReviewedAt = resumptionReviewedAt;
    }

    public String getResumptionReviewNote() {
        return resumptionReviewNote;
    }

    public void setResumptionReviewNote(String resumptionReviewNote) {
        this.resumptionReviewNote = resumptionReviewNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

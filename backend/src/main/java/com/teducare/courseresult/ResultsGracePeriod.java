package com.teducare.courseresult;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A single institution-wide setting — the results-upload deadline and how many days of grace follow it. Purely informational/display (shown as "Deadline in N days" on a lecturer's course) — not enforced as a hard lock on score entry, since nothing in the reference design shows a blocked state once the deadline passes. */
@Entity
@Table(name = "results_grace_periods", schema = "dbo")
public class ResultsGracePeriod {

    @Id
    @Column(name = "institution_id", length = 64)
    private String institutionId;

    @Column(name = "deadline_date", nullable = false)
    private LocalDate deadlineDate;

    @Column(name = "grace_period_days", nullable = false)
    private int gracePeriodDays;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ResultsGracePeriod() {
    }

    public ResultsGracePeriod(String institutionId, LocalDate deadlineDate, int gracePeriodDays, Instant updatedAt) {
        this.institutionId = institutionId;
        this.deadlineDate = deadlineDate;
        this.gracePeriodDays = gracePeriodDays;
        this.updatedAt = updatedAt;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public LocalDate getDeadlineDate() {
        return deadlineDate;
    }

    public void setDeadlineDate(LocalDate deadlineDate) {
        this.deadlineDate = deadlineDate;
    }

    public int getGracePeriodDays() {
        return gracePeriodDays;
    }

    public void setGracePeriodDays(int gracePeriodDays) {
        this.gracePeriodDays = gracePeriodDays;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

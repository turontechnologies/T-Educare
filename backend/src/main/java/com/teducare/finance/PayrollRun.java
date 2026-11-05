package com.teducare.finance;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One per (institution, year, month) — enforced by a unique index, so running the same period twice is a `409`, matching "can't be undone from here." */
@Entity
@Table(name = "payroll_runs", schema = "dbo")
public class PayrollRun {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "period_year", nullable = false)
    private int periodYear;

    @Column(name = "period_month", nullable = false)
    private int periodMonth;

    @Column(name = "run_by_name", nullable = false, length = 150)
    private String runByName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected PayrollRun() {
    }

    public PayrollRun(
            String id, String institutionId, int periodYear, int periodMonth, String runByName, Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.periodYear = periodYear;
        this.periodMonth = periodMonth;
        this.runByName = runByName;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public int getPeriodYear() {
        return periodYear;
    }

    public int getPeriodMonth() {
        return periodMonth;
    }

    public String getRunByName() {
        return runByName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

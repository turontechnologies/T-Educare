package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One row per staff, editable any time by an admin — {@code allowances}/
 * {@code deductions} are plain admin-entered totals (no PAYE/pension
 * formula, by explicit instruction), snapshotted into a {@link Payslip}
 * whenever payroll is run for a period. {@code onHold} excludes the
 * staff member from the next run entirely (no payslip generated),
 * matching the reference design's own "Mr. X (skipped)" treatment.
 */
@Entity
@Table(name = "staff_payroll_profiles", schema = "dbo")
public class StaffPayrollProfile {

    @Id
    @Column(name = "staff_id", length = 64)
    private String staffId;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "allowances", nullable = false, precision = 14, scale = 2)
    private BigDecimal allowances;

    @Column(name = "deductions", nullable = false, precision = 14, scale = 2)
    private BigDecimal deductions;

    @Column(name = "on_hold", nullable = false)
    private boolean onHold;

    @Column(name = "on_hold_reason", length = 300)
    private String onHoldReason;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StaffPayrollProfile() {
    }

    public StaffPayrollProfile(
            String staffId, String institutionId, BigDecimal allowances, BigDecimal deductions, boolean onHold,
            String onHoldReason, Instant updatedAt) {
        this.staffId = staffId;
        this.institutionId = institutionId;
        this.allowances = allowances;
        this.deductions = deductions;
        this.onHold = onHold;
        this.onHoldReason = onHoldReason;
        this.updatedAt = updatedAt;
    }

    public String getStaffId() {
        return staffId;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public BigDecimal getAllowances() {
        return allowances;
    }

    public void setAllowances(BigDecimal allowances) {
        this.allowances = allowances;
    }

    public BigDecimal getDeductions() {
        return deductions;
    }

    public void setDeductions(BigDecimal deductions) {
        this.deductions = deductions;
    }

    public boolean isOnHold() {
        return onHold;
    }

    public void setOnHold(boolean onHold) {
        this.onHold = onHold;
    }

    public String getOnHoldReason() {
        return onHoldReason;
    }

    public void setOnHoldReason(String onHoldReason) {
        this.onHoldReason = onHoldReason;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

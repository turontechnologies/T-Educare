package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A snapshot taken at {@link PayrollRun} time — {@code basicPay}/{@code allowances}/{@code deductions} are copied from {@code StaffMember.salaryAmount}/{@link StaffPayrollProfile} as they stood that moment, never recomputed later even if the profile changes afterward. */
@Entity
@Table(name = "payslips", schema = "dbo")
public class Payslip {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "payroll_run_id", nullable = false, length = 64)
    private String payrollRunId;

    @Column(name = "staff_id", nullable = false, length = 64)
    private String staffId;

    @Column(name = "period_year", nullable = false)
    private int periodYear;

    @Column(name = "period_month", nullable = false)
    private int periodMonth;

    @Column(name = "basic_pay", nullable = false, precision = 14, scale = 2)
    private BigDecimal basicPay;

    @Column(name = "allowances", nullable = false, precision = 14, scale = 2)
    private BigDecimal allowances;

    @Column(name = "deductions", nullable = false, precision = 14, scale = 2)
    private BigDecimal deductions;

    @Column(name = "net_pay", nullable = false, precision = 14, scale = 2)
    private BigDecimal netPay;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Payslip() {
    }

    public Payslip(
            String id, String institutionId, String payrollRunId, String staffId, int periodYear, int periodMonth,
            BigDecimal basicPay, BigDecimal allowances, BigDecimal deductions, BigDecimal netPay, Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.payrollRunId = payrollRunId;
        this.staffId = staffId;
        this.periodYear = periodYear;
        this.periodMonth = periodMonth;
        this.basicPay = basicPay;
        this.allowances = allowances;
        this.deductions = deductions;
        this.netPay = netPay;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getPayrollRunId() {
        return payrollRunId;
    }

    public String getStaffId() {
        return staffId;
    }

    public int getPeriodYear() {
        return periodYear;
    }

    public int getPeriodMonth() {
        return periodMonth;
    }

    public BigDecimal getBasicPay() {
        return basicPay;
    }

    public BigDecimal getAllowances() {
        return allowances;
    }

    public BigDecimal getDeductions() {
        return deductions;
    }

    public BigDecimal getNetPay() {
        return netPay;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

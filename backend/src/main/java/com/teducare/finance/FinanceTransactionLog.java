package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Append-only audit log across every Financials sub-module — never edited or deleted (matches the reference design's own "This log is read-only... corrections are recorded as new entries" banner). */
@Entity
@Table(name = "finance_transaction_log", schema = "dbo")
public class FinanceTransactionLog {

    public static final String PAYMENT_RECORDED = "PAYMENT_RECORDED";
    public static final String GATEWAY_PAYMENT_RECEIVED = "GATEWAY_PAYMENT_RECEIVED";
    public static final String PAYMENT_ALLOCATED = "PAYMENT_ALLOCATED";
    public static final String PAYROLL_RUN = "PAYROLL_RUN";

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "event_type", nullable = false, length = 40)
    private String eventType;

    @Column(name = "student_id", length = 64)
    private String studentId;

    @Column(name = "staff_id", length = 64)
    private String staffId;

    @Column(name = "amount", precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "details", nullable = false, columnDefinition = "TEXT")
    private String details;

    @Column(name = "recorded_by_name", nullable = false, length = 150)
    private String recordedByName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected FinanceTransactionLog() {
    }

    public FinanceTransactionLog(
            String id,
            String institutionId,
            String eventType,
            String studentId,
            String staffId,
            BigDecimal amount,
            String reference,
            String details,
            String recordedByName,
            Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.eventType = eventType;
        this.studentId = studentId;
        this.staffId = staffId;
        this.amount = amount;
        this.reference = reference;
        this.details = details;
        this.recordedByName = recordedByName;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getEventType() {
        return eventType;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getStaffId() {
        return staffId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getReference() {
        return reference;
    }

    public String getDetails() {
        return details;
    }

    public String getRecordedByName() {
        return recordedByName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

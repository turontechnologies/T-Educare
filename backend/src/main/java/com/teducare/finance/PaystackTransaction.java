package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One "Pay via Paystack" attempt — created `PENDING` when a payment link is generated for a student's outstanding balance, flipped to `SUCCESS`/`FAILED` by the webhook. On `SUCCESS` the amount is auto-allocated oldest-due-first across that student's unpaid lines (see {@code FinanceService#handlePaystackWebhook}). */
@Entity
@Table(name = "paystack_transactions", schema = "dbo")
public class PaystackTransaction {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_SUCCESS = "SUCCESS";
    public static final String STATUS_FAILED = "FAILED";

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "reference", nullable = false, length = 100)
    private String reference;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "authorization_url", length = 500)
    private String authorizationUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    protected PaystackTransaction() {
    }

    public PaystackTransaction(
            String id,
            String institutionId,
            String studentId,
            String reference,
            BigDecimal amount,
            String status,
            String authorizationUrl,
            Instant createdAt,
            Instant paidAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.studentId = studentId;
        this.reference = reference;
        this.amount = amount;
        this.status = status;
        this.authorizationUrl = authorizationUrl;
        this.createdAt = createdAt;
        this.paidAt = paidAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getReference() {
        return reference;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAuthorizationUrl() {
        return authorizationUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(Instant paidAt) {
        this.paidAt = paidAt;
    }
}

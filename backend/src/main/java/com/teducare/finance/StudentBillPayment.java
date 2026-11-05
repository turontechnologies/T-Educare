package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One payment against exactly one {@link StudentBillLine} — never split across lines, matching the reference design's own "Record Offline Payment" dialog (one fee line picker per payment). {@code PAYSTACK} payments are written by the webhook handler, same shape as a manual one. */
@Entity
@Table(name = "student_bill_payments", schema = "dbo")
public class StudentBillPayment {

    public static final String METHOD_BANK_TRANSFER = "BANK_TRANSFER";
    public static final String METHOD_CASH = "CASH";
    public static final String METHOD_POS = "POS";
    public static final String METHOD_CHEQUE = "CHEQUE";
    public static final String METHOD_PAYSTACK = "PAYSTACK";

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "bill_line_id", nullable = false, length = 64)
    private String billLineId;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "method", nullable = false, length = 20)
    private String method;

    @Column(name = "reference", length = 100)
    private String reference;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "proof_url", length = 500)
    private String proofUrl;

    @Column(name = "recorded_by_name", nullable = false, length = 150)
    private String recordedByName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected StudentBillPayment() {
    }

    public StudentBillPayment(
            String id,
            String institutionId,
            String studentId,
            String billLineId,
            BigDecimal amount,
            String method,
            String reference,
            LocalDate paymentDate,
            String proofUrl,
            String recordedByName,
            Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.studentId = studentId;
        this.billLineId = billLineId;
        this.amount = amount;
        this.method = method;
        this.reference = reference;
        this.paymentDate = paymentDate;
        this.proofUrl = proofUrl;
        this.recordedByName = recordedByName;
        this.createdAt = createdAt;
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

    public String getBillLineId() {
        return billLineId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public String getMethod() {
        return method;
    }

    public String getReference() {
        return reference;
    }

    public LocalDate getPaymentDate() {
        return paymentDate;
    }

    public String getProofUrl() {
        return proofUrl;
    }

    public String getRecordedByName() {
        return recordedByName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

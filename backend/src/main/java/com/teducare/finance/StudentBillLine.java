package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One payable line on a student's bill — either a {@code CHARGE} (a real
 * {@link FeeType} billed to this student) or a {@code PENALTY} (an
 * automatically-generated late fee on a specific overdue, unpaid {@code
 * CHARGE} line, linked via {@code parentLineId}). {@code balance} is the
 * remaining unpaid amount, decremented by {@link StudentBillPayment}s
 * against this line — never recomputed from a payments list at read
 * time, since a line's balance is the one value every payment against it
 * must agree on.
 */
@Entity
@Table(name = "student_bill_lines", schema = "dbo")
public class StudentBillLine {

    public static final String TYPE_CHARGE = "CHARGE";
    public static final String TYPE_PENALTY = "PENALTY";

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "fee_type_id", nullable = false, length = 64)
    private String feeTypeId;

    @Column(name = "line_type", nullable = false, length = 20)
    private String lineType;

    @Column(name = "parent_line_id", length = 64)
    private String parentLineId;

    @Column(name = "description", nullable = false, length = 200)
    private String description;

    @Column(name = "reference", nullable = false, length = 30)
    private String reference;

    @Column(name = "charge_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal chargeAmount;

    @Column(name = "balance", nullable = false, precision = 14, scale = 2)
    private BigDecimal balance;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "academic_session_id", nullable = false, length = 64)
    private String academicSessionId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected StudentBillLine() {
    }

    public StudentBillLine(
            String id,
            String institutionId,
            String studentId,
            String feeTypeId,
            String lineType,
            String parentLineId,
            String description,
            String reference,
            BigDecimal chargeAmount,
            BigDecimal balance,
            LocalDate dueDate,
            String academicSessionId,
            Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.studentId = studentId;
        this.feeTypeId = feeTypeId;
        this.lineType = lineType;
        this.parentLineId = parentLineId;
        this.description = description;
        this.reference = reference;
        this.chargeAmount = chargeAmount;
        this.balance = balance;
        this.dueDate = dueDate;
        this.academicSessionId = academicSessionId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public String getFeeTypeId() {
        return feeTypeId;
    }

    public String getLineType() {
        return lineType;
    }

    public String getParentLineId() {
        return parentLineId;
    }

    public String getDescription() {
        return description;
    }

    public String getReference() {
        return reference;
    }

    public BigDecimal getChargeAmount() {
        return chargeAmount;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public String getAcademicSessionId() {
        return academicSessionId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

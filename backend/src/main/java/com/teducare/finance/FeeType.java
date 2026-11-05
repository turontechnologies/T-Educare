package com.teducare.finance;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A fee an institution charges — scoped by {@code departmentId}/{@code
 * programLevelId} (either or both null = "All programmes"/"All levels",
 * matching the Figma reference's own wording) and a required {@code
 * academicSessionId}. Creating one bills every currently-active student
 * who matches its scope — see {@link FinanceService#generateBillLines}.
 * {@code latePenaltyType} is {@code NONE}/{@code FLAT}/{@code PERCENTAGE};
 * {@code latePenaltyValue} is the flat naira amount or the percentage,
 * read according to the type.
 */
@Entity
@Table(name = "fee_types", schema = "dbo")
public class FeeType {

    public static final String PENALTY_NONE = "NONE";
    public static final String PENALTY_FLAT = "FLAT";
    public static final String PENALTY_PERCENTAGE = "PERCENTAGE";

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "department_id", length = 64)
    private String departmentId;

    @Column(name = "program_level_id", length = 64)
    private String programLevelId;

    @Column(name = "academic_session_id", nullable = false, length = 64)
    private String academicSessionId;

    @Column(name = "amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "late_penalty_type", nullable = false, length = 20)
    private String latePenaltyType;

    @Column(name = "late_penalty_value", precision = 14, scale = 2)
    private BigDecimal latePenaltyValue;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected FeeType() {
    }

    public FeeType(
            String id,
            String institutionId,
            String code,
            String name,
            String departmentId,
            String programLevelId,
            String academicSessionId,
            BigDecimal amount,
            LocalDate dueDate,
            String latePenaltyType,
            BigDecimal latePenaltyValue,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.code = code;
        this.name = name;
        this.departmentId = departmentId;
        this.programLevelId = programLevelId;
        this.academicSessionId = academicSessionId;
        this.amount = amount;
        this.dueDate = dueDate;
        this.latePenaltyType = latePenaltyType;
        this.latePenaltyValue = latePenaltyValue;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public String getProgramLevelId() {
        return programLevelId;
    }

    public void setProgramLevelId(String programLevelId) {
        this.programLevelId = programLevelId;
    }

    public String getAcademicSessionId() {
        return academicSessionId;
    }

    public void setAcademicSessionId(String academicSessionId) {
        this.academicSessionId = academicSessionId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getLatePenaltyType() {
        return latePenaltyType;
    }

    public void setLatePenaltyType(String latePenaltyType) {
        this.latePenaltyType = latePenaltyType;
    }

    public BigDecimal getLatePenaltyValue() {
        return latePenaltyValue;
    }

    public void setLatePenaltyValue(BigDecimal latePenaltyValue) {
        this.latePenaltyValue = latePenaltyValue;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getArchivedAt() {
        return archivedAt;
    }

    public void setArchivedAt(Instant archivedAt) {
        this.archivedAt = archivedAt;
    }
}

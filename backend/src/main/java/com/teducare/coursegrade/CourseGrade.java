package com.teducare.coursegrade;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** The grading scale: a CRUD list of grade bands (API_CONTRACT.md §7.9). See {@link GradingScale} for the separate institution-wide max-grade-point setting. */
@Entity
@Table(name = "course_grades", schema = "dbo")
public class CourseGrade {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "remark", nullable = false, length = 150)
    private String remark;

    @Column(name = "grade_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal gradeScore;

    @Column(name = "minimum_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal minimumScore;

    @Column(name = "maximum_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal maximumScore;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected CourseGrade() {
    }

    public CourseGrade(
            String id,
            String institutionId,
            String code,
            String remark,
            BigDecimal gradeScore,
            BigDecimal minimumScore,
            BigDecimal maximumScore,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.code = code;
        this.remark = remark;
        this.gradeScore = gradeScore;
        this.minimumScore = minimumScore;
        this.maximumScore = maximumScore;
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

    public void setCode(String code) {
        this.code = code;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public BigDecimal getGradeScore() {
        return gradeScore;
    }

    public void setGradeScore(BigDecimal gradeScore) {
        this.gradeScore = gradeScore;
    }

    public BigDecimal getMinimumScore() {
        return minimumScore;
    }

    public void setMinimumScore(BigDecimal minimumScore) {
        this.minimumScore = minimumScore;
    }

    public BigDecimal getMaximumScore() {
        return maximumScore;
    }

    public void setMaximumScore(BigDecimal maximumScore) {
        this.maximumScore = maximumScore;
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

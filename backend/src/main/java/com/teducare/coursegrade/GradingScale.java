package com.teducare.coursegrade;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A single institution-wide setting, not a collection (API_CONTRACT.md
 * §7.9) — `institutionId` is the primary key, one row per institution,
 * upserted wholesale by `PUT /grading-scale`. Deliberately not a row in
 * {@link CourseGrade}'s own table.
 */
@Entity
@Table(name = "grading_scale", schema = "dbo")
public class GradingScale {

    @Id
    @Column(name = "institution_id", length = 64)
    private String institutionId;

    @Column(name = "max_grade_point", nullable = false, precision = 5, scale = 2)
    private BigDecimal maxGradePoint;

    protected GradingScale() {
    }

    public GradingScale(String institutionId, BigDecimal maxGradePoint) {
        this.institutionId = institutionId;
        this.maxGradePoint = maxGradePoint;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public BigDecimal getMaxGradePoint() {
        return maxGradePoint;
    }

    public void setMaxGradePoint(BigDecimal maxGradePoint) {
        this.maxGradePoint = maxGradePoint;
    }
}

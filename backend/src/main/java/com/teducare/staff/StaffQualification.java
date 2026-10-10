package com.teducare.staff;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One academic qualification on a staff member's record — degree, field
 * of study, and the institution attended (the "which school did they
 * attend" ask, distinct from this app's own School/Faculty hierarchy,
 * which is about the institution's own org chart, not an external alma
 * mater). A real editable list (not append-only like Student's
 * disciplinary history) since a typo in a degree/year is a correction,
 * not a historical event.
 */
@Entity
@Table(name = "staff_qualifications", schema = "dbo")
public class StaffQualification {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "staff_id", nullable = false, length = 64)
    private String staffId;

    @Column(name = "degree", nullable = false, length = 150)
    private String degree;

    @Column(name = "field_of_study", nullable = false, length = 200)
    private String fieldOfStudy;

    @Column(name = "institution_attended", nullable = false, length = 200)
    private String institutionAttended;

    @Column(name = "year_obtained")
    private Integer yearObtained;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected StaffQualification() {
    }

    public StaffQualification(
            String id,
            String staffId,
            String degree,
            String fieldOfStudy,
            String institutionAttended,
            Integer yearObtained,
            Instant createdAt) {
        this.id = id;
        this.staffId = staffId;
        this.degree = degree;
        this.fieldOfStudy = fieldOfStudy;
        this.institutionAttended = institutionAttended;
        this.yearObtained = yearObtained;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getStaffId() {
        return staffId;
    }

    public String getDegree() {
        return degree;
    }

    public String getFieldOfStudy() {
        return fieldOfStudy;
    }

    public String getInstitutionAttended() {
        return institutionAttended;
    }

    public Integer getYearObtained() {
        return yearObtained;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

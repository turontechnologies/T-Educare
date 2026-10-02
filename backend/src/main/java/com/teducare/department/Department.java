package com.teducare.department;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Stores both `facultyId` and `schoolId` as independent FKs — this
 * resource does NOT derive its school through its faculty
 * (API_CONTRACT.md §7.6). Deliberate modeling choice: the reference this
 * was built against pairs a department's faculty and school
 * independently (e.g. a "Law Department" under "Faculty of Law" paired
 * with a different school than Faculty of Law's own schoolId).
 */
@Entity
@Table(name = "departments", schema = "dbo")
public class Department {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "hod_name", nullable = false, length = 150)
    private String hodName;

    @Column(name = "faculty_id", nullable = false, length = 64)
    private String facultyId;

    @Column(name = "school_id", nullable = false, length = 64)
    private String schoolId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Department() {
    }

    public Department(
            String id,
            String institutionId,
            String name,
            String hodName,
            String facultyId,
            String schoolId,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.name = name;
        this.hodName = hodName;
        this.facultyId = facultyId;
        this.schoolId = schoolId;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getHodName() {
        return hodName;
    }

    public void setHodName(String hodName) {
        this.hodName = hodName;
    }

    public String getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(String facultyId) {
        this.facultyId = facultyId;
    }

    public String getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(String schoolId) {
        this.schoolId = schoolId;
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

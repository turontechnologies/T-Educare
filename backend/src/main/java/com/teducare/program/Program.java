package com.teducare.program;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Like Departments (§7.6), stores its parent references independently
 * rather than deriving one through another: `departmentId` and
 * `facultyId` are both real FKs, picked separately (API_CONTRACT.md
 * §7.7). No `schoolId` here — the reference data's own "School" column
 * for programs actually carried program-type values, not real school
 * names, so it's modeled as `programType` instead.
 */
@Entity
@Table(name = "programs", schema = "dbo")
public class Program {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "department_id", nullable = false, length = 64)
    private String departmentId;

    @Column(name = "faculty_id", nullable = false, length = 64)
    private String facultyId;

    @Column(name = "program_type", nullable = false, length = 20)
    private String programType;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Program() {
    }

    public Program(
            String id,
            String institutionId,
            String name,
            String departmentId,
            String facultyId,
            String programType,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.name = name;
        this.departmentId = departmentId;
        this.facultyId = facultyId;
        this.programType = programType;
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

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public String getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(String facultyId) {
        this.facultyId = facultyId;
    }

    public String getProgramType() {
        return programType;
    }

    public void setProgramType(String programType) {
        this.programType = programType;
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

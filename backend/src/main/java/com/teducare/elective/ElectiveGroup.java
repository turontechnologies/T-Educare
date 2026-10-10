package com.teducare.elective;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A "choose N of these courses" requirement, scoped to one department and
 * program level (e.g. "Elective Group 1" at 300L: pick one of CSC301 or
 * CSC305). {@code courseIds} is stored as a comma-joined string — same
 * convention as {@code StudentAcademicRecord.carryoverCourseIds}, not a
 * separate join table, since this is always read/written as a whole list
 * on this record, never queried per-course. {@code minSelect}/
 * {@code maxSelect} are both inclusive; a plain "pick exactly one" group
 * sets both to 1. {@link com.teducare.registration.CourseRegistrationService}
 * is the only place this is actually enforced.
 */
@Entity
@Table(name = "elective_groups", schema = "dbo")
public class ElectiveGroup {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "department_id", nullable = false, length = 64)
    private String departmentId;

    @Column(name = "program_level_id", nullable = false, length = 64)
    private String programLevelId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "min_select", nullable = false)
    private int minSelect;

    @Column(name = "max_select", nullable = false)
    private int maxSelect;

    @Column(name = "course_ids", length = 1000)
    private String courseIds;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected ElectiveGroup() {
    }

    public ElectiveGroup(
            String id,
            String institutionId,
            String departmentId,
            String programLevelId,
            String name,
            int minSelect,
            int maxSelect,
            String courseIds,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.departmentId = departmentId;
        this.programLevelId = programLevelId;
        this.name = name;
        this.minSelect = minSelect;
        this.maxSelect = maxSelect;
        this.courseIds = courseIds;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getMinSelect() {
        return minSelect;
    }

    public void setMinSelect(int minSelect) {
        this.minSelect = minSelect;
    }

    public int getMaxSelect() {
        return maxSelect;
    }

    public void setMaxSelect(int maxSelect) {
        this.maxSelect = maxSelect;
    }

    public String getCourseIds() {
        return courseIds;
    }

    public void setCourseIds(String courseIds) {
        this.courseIds = courseIds;
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

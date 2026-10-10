package com.teducare.course;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A "borrowed course" row: {@code Course.departmentId} is the course's
 * home/owning department, but another department can also require its
 * own students to take it — this is that explicit grant. Deliberately
 * NOT a database-level unique/foreign-key constraint on (course_id,
 * department_id) — uniqueness is enforced in {@link CourseService}, same
 * convention as every other uniqueness rule in this codebase (matric
 * numbers, course codes, staff IDs).
 *
 * {@code unitOverride} lets the same course carry a different credit
 * load for the borrowing department (e.g. a 3-unit course for its home
 * department but only 2 units as a service course elsewhere) — null
 * means "use the course's own base unit". {@code compulsory} marks that
 * the borrowing department treats it as a real requirement (not an
 * elective) — real "must not fail it" enforcement depends on a future
 * Results Management module (per-course grades aren't modeled yet); this
 * flag is the registration-time half of that intent.
 */
@Entity
@Table(name = "course_department_offerings", schema = "dbo")
public class CourseDepartmentOffering {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "course_id", nullable = false, length = 64)
    private String courseId;

    @Column(name = "department_id", nullable = false, length = 64)
    private String departmentId;

    @Column(name = "unit_override")
    private Integer unitOverride;

    @Column(name = "compulsory", nullable = false)
    private boolean compulsory;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected CourseDepartmentOffering() {
    }

    public CourseDepartmentOffering(
            String id,
            String institutionId,
            String courseId,
            String departmentId,
            Integer unitOverride,
            boolean compulsory,
            Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.courseId = courseId;
        this.departmentId = departmentId;
        this.unitOverride = unitOverride;
        this.compulsory = compulsory;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getCourseId() {
        return courseId;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public Integer getUnitOverride() {
        return unitOverride;
    }

    public boolean isCompulsory() {
        return compulsory;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

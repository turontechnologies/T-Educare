package com.teducare.course;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Like Departments (§7.6) and Programs (§7.7), stores its parent
 * references independently — `departmentId` and `schoolId` are both
 * real FKs, picked separately, not one derived through the other
 * (API_CONTRACT.md §7.10). Uniqueness is enforced on `code`, not `name`
 * — course codes are the real-world unique key.
 */
@Entity
@Table(name = "courses", schema = "dbo")
public class Course {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "code", nullable = false, length = 30)
    private String code;

    @Column(name = "department_id", nullable = false, length = 64)
    private String departmentId;

    @Column(name = "school_id", nullable = false, length = 64)
    private String schoolId;

    /**
     * FK to ProgramLevel.id — which level this course is taken at (e.g.
     * 100L), scoped alongside departmentId so the registration system can
     * offer "this department's 100L courses". Nullable at the DB level
     * only because any course row that pre-dates this field has no
     * sensible value to backfill it with — every create/update through
     * {@link CourseService} still requires it.
     */
    @Column(name = "program_level_id", length = 64)
    private String programLevelId;

    /** Credit unit — drives the registration system's total-unit cap (API_CONTRACT.md §7.11). */
    @Column(name = "unit", nullable = false)
    private int unit;

    /**
     * Which semester-of-the-year (1 or 2) this course is taken in — the
     * same 100L department can have a completely different course list
     * for its first vs. second semester. Matched against
     * {@link com.teducare.academics.AcademicSemester#getSemesterNumber()}
     * by {@link com.teducare.registration.CourseRegistrationService} so a
     * 2nd-semester course never appears registrable while a 1st-semester
     * instance is open, or vice versa. Nullable at the DB level only
     * because a pre-existing course row has no sensible value to
     * backfill with; every create/update through {@link CourseService}
     * still requires it.
     */
    @Column(name = "semester_number")
    private Integer semesterNumber;

    /** FK to StaffMember.id — nullable, a course doesn't require a lecturer assigned. Drives "how many courses is this staff member lecturing" on the Staff Management detail view. */
    @Column(name = "lecturer_id", length = 64)
    private String lecturerId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Course() {
    }

    public Course(
            String id,
            String institutionId,
            String name,
            String code,
            String departmentId,
            String schoolId,
            String programLevelId,
            int unit,
            Integer semesterNumber,
            String lecturerId,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.name = name;
        this.code = code;
        this.departmentId = departmentId;
        this.schoolId = schoolId;
        this.programLevelId = programLevelId;
        this.unit = unit;
        this.semesterNumber = semesterNumber;
        this.lecturerId = lecturerId;
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public String getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(String schoolId) {
        this.schoolId = schoolId;
    }

    public String getProgramLevelId() {
        return programLevelId;
    }

    public void setProgramLevelId(String programLevelId) {
        this.programLevelId = programLevelId;
    }

    public int getUnit() {
        return unit;
    }

    public void setUnit(int unit) {
        this.unit = unit;
    }

    public String getLecturerId() {
        return lecturerId;
    }

    public void setLecturerId(String lecturerId) {
        this.lecturerId = lecturerId;
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

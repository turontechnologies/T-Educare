package com.teducare.registration;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One course a student registered for in one semester. A full registration
 * (all of a student's courses for a semester) is replaced wholesale via
 * {@code PUT /course-registrations} — same "full replace" convention as
 * {@code linkModules}/{@code GradingScale} — rather than individually
 * added/removed one at a time, so an admin revising a student's selection
 * before the semester locks never leaves stale rows behind.
 * {@code unitSnapshot} is captured at registration time rather than joined
 * live from {@code Course.unit}, so a later edit to a course's unit count
 * never silently rewrites the apparent total of a past registration.
 */
@Entity
@Table(name = "course_registrations", schema = "dbo")
public class CourseRegistration {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "course_id", nullable = false, length = 64)
    private String courseId;

    @Column(name = "academic_semester_id", nullable = false, length = 64)
    private String academicSemesterId;

    @Column(name = "unit_snapshot", nullable = false)
    private int unitSnapshot;

    /** Whether this course was one of the student's outstanding carryovers at the time of this registration. */
    @Column(name = "is_carryover", nullable = false)
    private boolean isCarryover;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected CourseRegistration() {
    }

    public CourseRegistration(
            String id,
            String institutionId,
            String studentId,
            String courseId,
            String academicSemesterId,
            int unitSnapshot,
            boolean isCarryover,
            Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.studentId = studentId;
        this.courseId = courseId;
        this.academicSemesterId = academicSemesterId;
        this.unitSnapshot = unitSnapshot;
        this.isCarryover = isCarryover;
        this.createdAt = createdAt;
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

    public String getCourseId() {
        return courseId;
    }

    public String getAcademicSemesterId() {
        return academicSemesterId;
    }

    public int getUnitSnapshot() {
        return unitSnapshot;
    }

    public boolean isCarryover() {
        return isCarryover;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

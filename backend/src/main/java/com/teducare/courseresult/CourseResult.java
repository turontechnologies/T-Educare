package com.teducare.courseresult;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One student's raw score in one course, for one semester — the minimal
 * foundation GPA/CGPA is computed from. Deliberately just a score; the
 * grade code/remark/grade-point it maps to is never stored here, always
 * looked up live against that institution's current {@code CourseGrade}
 * bands at read time (same "never denormalize something computable" rule
 * as Leave balances and Attendance's daily status) — so editing a grade
 * band's boundaries retroactively reclassifies every existing result
 * instead of leaving them stuck on whatever band was active when they
 * were entered.
 */
@Entity
@Table(name = "course_results", schema = "dbo")
public class CourseResult {

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

    @Column(name = "score", nullable = false, precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CourseResult() {
    }

    public CourseResult(
            String id,
            String institutionId,
            String studentId,
            String courseId,
            String academicSemesterId,
            BigDecimal score,
            Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.studentId = studentId;
        this.courseId = courseId;
        this.academicSemesterId = academicSemesterId;
        this.score = score;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

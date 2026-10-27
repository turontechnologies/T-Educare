package com.teducare.courseresult;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One student's score for one {@link MarkingGuideComponent} of one course, in one semester — the real unit of entry; "Overall %" is always the sum of a student's component scores for that (course, semester), computed at read time, never stored. */
@Entity
@Table(name = "course_result_scores", schema = "dbo")
public class CourseResultScore {

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

    @Column(name = "component_id", nullable = false, length = 64)
    private String componentId;

    @Column(name = "score", nullable = false, precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CourseResultScore() {
    }

    public CourseResultScore(
            String id,
            String institutionId,
            String studentId,
            String courseId,
            String academicSemesterId,
            String componentId,
            BigDecimal score,
            Instant createdAt,
            Instant updatedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.studentId = studentId;
        this.courseId = courseId;
        this.academicSemesterId = academicSemesterId;
        this.componentId = componentId;
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

    public String getComponentId() {
        return componentId;
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

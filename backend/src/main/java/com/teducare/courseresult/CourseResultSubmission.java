package com.teducare.courseresult;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One (course, semester)'s results lifecycle — created lazily on first score
 * entry. {@code status} is the only real stored state; the richer labels
 * shown in the UI (Not Started/In Progress/Awaiting Submission on the
 * teacher side, Pending Completion/Awaiting Publishing on the admin side)
 * are derived display strings computed from this status plus the live
 * completion count — see {@code CourseResultService.courseStatusLabel}.
 *
 * <pre>
 * IN_PROGRESS --(submit, only once every student has every component scored)--&gt; SUBMITTED
 * SUBMITTED --(publish)--&gt; PUBLISHED
 * PUBLISHED --(unpublish, with a reason)--&gt; SUBMITTED
 * </pre>
 */
@Entity
@Table(name = "course_result_submissions", schema = "dbo")
public class CourseResultSubmission {

    public static final String IN_PROGRESS = "IN_PROGRESS";
    public static final String SUBMITTED = "SUBMITTED";
    public static final String PUBLISHED = "PUBLISHED";

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "course_id", nullable = false, length = 64)
    private String courseId;

    @Column(name = "academic_semester_id", nullable = false, length = 64)
    private String academicSemesterId;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CourseResultSubmission() {
    }

    public CourseResultSubmission(
            String id, String institutionId, String courseId, String academicSemesterId, String status,
            Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.courseId = courseId;
        this.academicSemesterId = academicSemesterId;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public String getAcademicSemesterId() {
        return academicSemesterId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

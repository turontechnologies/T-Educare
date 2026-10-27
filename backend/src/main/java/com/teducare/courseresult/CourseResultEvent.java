package com.teducare.courseresult;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Append-only audit log backing the "Course Result History" dialog — same cached-value-plus-immutable-log shape as {@code InstitutionLicenseEvent}/{@code StudentDisciplinaryRecord}. {@code reason} is only ever set on an UNPUBLISHED event. */
@Entity
@Table(name = "course_result_events", schema = "dbo")
public class CourseResultEvent {

    public static final String SUBMITTED = "SUBMITTED";
    public static final String PUBLISHED = "PUBLISHED";
    public static final String UNPUBLISHED = "UNPUBLISHED";

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "course_id", nullable = false, length = 64)
    private String courseId;

    @Column(name = "academic_semester_id", nullable = false, length = 64)
    private String academicSemesterId;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @Column(name = "actor_name", nullable = false, length = 200)
    private String actorName;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected CourseResultEvent() {
    }

    public CourseResultEvent(
            String id, String institutionId, String courseId, String academicSemesterId, String eventType,
            String actorName, String reason, Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.courseId = courseId;
        this.academicSemesterId = academicSemesterId;
        this.eventType = eventType;
        this.actorName = actorName;
        this.reason = reason;
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

    public String getAcademicSemesterId() {
        return academicSemesterId;
    }

    public String getEventType() {
        return eventType;
    }

    public String getActorName() {
        return actorName;
    }

    public String getReason() {
        return reason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

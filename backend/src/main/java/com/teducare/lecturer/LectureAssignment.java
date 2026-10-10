package com.teducare.lecturer;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** "Lectures" (API_CONTRACT.md) — which {@link Lecturer} teaches which Course, for a given academic session. */
@Entity
@Table(name = "lecture_assignments", schema = "dbo")
public class LectureAssignment {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "lecturer_id", nullable = false, length = 64)
    private String lecturerId;

    @Column(name = "course_id", nullable = false, length = 64)
    private String courseId;

    @Column(name = "academic_session_id", nullable = false, length = 64)
    private String academicSessionId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected LectureAssignment() {
    }

    public LectureAssignment(
            String id,
            String institutionId,
            String lecturerId,
            String courseId,
            String academicSessionId,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.lecturerId = lecturerId;
        this.courseId = courseId;
        this.academicSessionId = academicSessionId;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getLecturerId() {
        return lecturerId;
    }

    public String getCourseId() {
        return courseId;
    }

    public String getAcademicSessionId() {
        return academicSessionId;
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

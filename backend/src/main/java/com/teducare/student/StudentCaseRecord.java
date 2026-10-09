package com.teducare.student;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A reported case/incident against a student — independent of (but may
 * lead to) a {@link StudentDisciplinaryRecord}: a case can exist and be
 * resolved/dismissed without ever becoming a formal disciplinary action.
 * Not append-only like the academic/disciplinary history — a case has a
 * real, editable lifecycle ("open" -> "resolved"/"dismissed").
 */
@Entity
@Table(name = "student_case_records", schema = "dbo")
public class StudentCaseRecord {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", nullable = false, length = 2000)
    private String description;

    /** "open" | "resolved" | "dismissed". */
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "reported_by", length = 64)
    private String reportedBy;

    @Column(name = "resolution_notes", length = 1000)
    private String resolutionNotes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected StudentCaseRecord() {
    }

    public StudentCaseRecord(
            String id,
            String studentId,
            String title,
            String description,
            String status,
            String reportedBy,
            String resolutionNotes,
            Instant createdAt,
            Instant resolvedAt) {
        this.id = id;
        this.studentId = studentId;
        this.title = title;
        this.description = description;
        this.status = status;
        this.reportedBy = reportedBy;
        this.resolutionNotes = resolutionNotes;
        this.createdAt = createdAt;
        this.resolvedAt = resolvedAt;
    }

    public String getId() {
        return id;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReportedBy() {
        return reportedBy;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public void setResolutionNotes(String resolutionNotes) {
        this.resolutionNotes = resolutionNotes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
}

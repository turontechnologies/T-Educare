package com.teducare.student;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Append-only disciplinary action log — mirrors the exact "cached current
 * value + immutable history" shape already established for institution
 * licensing: {@code Student.disciplinaryStatus} is the fast/current value,
 * this table is the full history of how it got there.
 */
@Entity
@Table(name = "student_disciplinary_records", schema = "dbo")
public class StudentDisciplinaryRecord {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    /** "SUSPENSION" | "EXPULSION" | "WARNING" | "REINSTATEMENT". */
    @Column(name = "action_type", nullable = false, length = 20)
    private String actionType;

    @Column(name = "reason", nullable = false, length = 1000)
    private String reason;

    @Column(name = "start_date")
    private Instant startDate;

    /** Nullable — a suspension may have a known return date, an expulsion/warning typically doesn't. */
    @Column(name = "end_date")
    private Instant endDate;

    /** The recording staff/admin's id. */
    @Column(name = "actor_id", length = 64)
    private String actorId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected StudentDisciplinaryRecord() {
    }

    public StudentDisciplinaryRecord(
            String id,
            String studentId,
            String actionType,
            String reason,
            Instant startDate,
            Instant endDate,
            String actorId,
            Instant createdAt) {
        this.id = id;
        this.studentId = studentId;
        this.actionType = actionType;
        this.reason = reason;
        this.startDate = startDate;
        this.endDate = endDate;
        this.actorId = actorId;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getActionType() {
        return actionType;
    }

    public String getReason() {
        return reason;
    }

    public Instant getStartDate() {
        return startDate;
    }

    public Instant getEndDate() {
        return endDate;
    }

    public String getActorId() {
        return actorId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

package com.teducare.staff;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Append-only disciplinary/penalty action log — mirrors the exact
 * "cached current value + immutable history" shape used for
 * {@code Student.disciplinaryStatus}/{@code StudentDisciplinaryRecord}:
 * {@code StaffMember.disciplinaryStatus} is the fast/current value, this
 * table is the full history of how it got there.
 */
@Entity
@Table(name = "staff_disciplinary_records", schema = "dbo")
public class StaffDisciplinaryRecord {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "staff_id", nullable = false, length = 64)
    private String staffId;

    /** "WARNING" | "QUERY" | "SUSPENSION" | "TERMINATION" | "REINSTATEMENT". */
    @Column(name = "action_type", nullable = false, length = 20)
    private String actionType;

    @Column(name = "reason", nullable = false, length = 1000)
    private String reason;

    @Column(name = "start_date")
    private Instant startDate;

    /** Nullable — a suspension may have a known return date, a query/warning/termination typically doesn't. */
    @Column(name = "end_date")
    private Instant endDate;

    /** The recording admin's id. */
    @Column(name = "actor_id", length = 64)
    private String actorId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected StaffDisciplinaryRecord() {
    }

    public StaffDisciplinaryRecord(
            String id,
            String staffId,
            String actionType,
            String reason,
            Instant startDate,
            Instant endDate,
            String actorId,
            Instant createdAt) {
        this.id = id;
        this.staffId = staffId;
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

    public String getStaffId() {
        return staffId;
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

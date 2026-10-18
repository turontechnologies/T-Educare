package com.teducare.leave;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** An admin-configured leave policy (e.g. "Annual Leave", "Sick Leave") — the default yearly allocation, and whether unused days roll over into the next year. */
@Entity
@Table(name = "leave_types", schema = "dbo")
public class LeaveType {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "default_days_per_year", nullable = false)
    private int defaultDaysPerYear;

    @Column(name = "is_rollover", nullable = false)
    private boolean rollover;

    /** Only meaningful when {@code rollover} is true — null means no cap. */
    @Column(name = "max_rollover_days")
    private Integer maxRolloverDays;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected LeaveType() {
    }

    public LeaveType(
            String id,
            String institutionId,
            String name,
            int defaultDaysPerYear,
            boolean rollover,
            Integer maxRolloverDays,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.name = name;
        this.defaultDaysPerYear = defaultDaysPerYear;
        this.rollover = rollover;
        this.maxRolloverDays = maxRolloverDays;
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

    public int getDefaultDaysPerYear() {
        return defaultDaysPerYear;
    }

    public void setDefaultDaysPerYear(int defaultDaysPerYear) {
        this.defaultDaysPerYear = defaultDaysPerYear;
    }

    public boolean isRollover() {
        return rollover;
    }

    public void setRollover(boolean rollover) {
        this.rollover = rollover;
    }

    public Integer getMaxRolloverDays() {
        return maxRolloverDays;
    }

    public void setMaxRolloverDays(Integer maxRolloverDays) {
        this.maxRolloverDays = maxRolloverDays;
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

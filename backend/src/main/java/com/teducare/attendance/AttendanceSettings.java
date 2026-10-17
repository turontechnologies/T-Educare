package com.teducare.attendance;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Institution-wide clock-in rules — a single row per institution, same "settings resource" shape as StudentIdentitySettings/RegistrationSettings. */
@Entity
@Table(name = "attendance_settings", schema = "dbo")
public class AttendanceSettings {

    @Id
    @Column(name = "institution_id", length = 64)
    private String institutionId;

    /** "HH:mm" — when staff are expected to clock in. */
    @Column(name = "resumption_time", nullable = false, length = 5)
    private String resumptionTime;

    /** "HH:mm" — when staff are expected to clock out. */
    @Column(name = "closing_time", nullable = false, length = 5)
    private String closingTime;

    /** Minutes of grace after resumptionTime before a clock-in counts as LATE. */
    @Column(name = "grace_period_minutes", nullable = false)
    private int gracePeriodMinutes;

    /** Comma-separated subset of MONDAY..SUNDAY. */
    @Column(name = "workdays", nullable = false, length = 100)
    private String workdays;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected AttendanceSettings() {
    }

    public AttendanceSettings(
            String institutionId,
            String resumptionTime,
            String closingTime,
            int gracePeriodMinutes,
            String workdays,
            Instant updatedAt) {
        this.institutionId = institutionId;
        this.resumptionTime = resumptionTime;
        this.closingTime = closingTime;
        this.gracePeriodMinutes = gracePeriodMinutes;
        this.workdays = workdays;
        this.updatedAt = updatedAt;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getResumptionTime() {
        return resumptionTime;
    }

    public void setResumptionTime(String resumptionTime) {
        this.resumptionTime = resumptionTime;
    }

    public String getClosingTime() {
        return closingTime;
    }

    public void setClosingTime(String closingTime) {
        this.closingTime = closingTime;
    }

    public int getGracePeriodMinutes() {
        return gracePeriodMinutes;
    }

    public void setGracePeriodMinutes(int gracePeriodMinutes) {
        this.gracePeriodMinutes = gracePeriodMinutes;
    }

    public String getWorkdays() {
        return workdays;
    }

    public void setWorkdays(String workdays) {
        this.workdays = workdays;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

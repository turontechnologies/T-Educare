package com.teducare.registration;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A single institution-wide setting, not a collection — mirrors
 * {@code coursegrade.GradingScale}'s exact shape: {@code institutionId}
 * is the primary key, one row per institution, upserted wholesale by
 * {@code PUT /registration-settings}. Governs how
 * {@code CourseRegistrationService} enforces the carryover-first rule, the
 * total-unit cap, and the registration window — deliberately a
 * per-institution policy rather than a hardcoded rule, since institutions
 * can legitimately want each enforced differently.
 *
 * <p>{@code registrationOpensAt}/{@code registrationClosesAt} are both
 * nullable — null means "no window set," which must mean registration
 * stays unrestricted (the original behavior, before this window existed),
 * not silently locked out. An admin opens a new window by setting both
 * before each semester's registration period, same way they already have
 * to touch this record to adjust the unit cap — reopening after a close
 * is nothing special, just the same update called again with a later
 * {@code registrationClosesAt} (or a fresh {@code registrationOpensAt} too).
 *
 * <p>{@code registrationGracePeriodEndsAt} is a distinct, separately-set
 * extension past {@code registrationClosesAt} — same "status + grace
 * timestamp" shape as {@code Institution.graceEndsAt} (API_CONTRACT.md
 * §4.8). Keeping it separate from just pushing {@code
 * registrationClosesAt} back lets "the window officially closed on X, but
 * a grace period ran until Y" stay distinguishable after the fact, and an
 * admin can set/extend it to whatever date they want, as many times as
 * they want, independent of the original window.
 */
@Entity
@Table(name = "registration_settings", schema = "dbo")
public class RegistrationSettings {

    @Id
    @Column(name = "institution_id", length = 64)
    private String institutionId;

    @Column(name = "require_carryover_clearance", nullable = false)
    private boolean requireCarryoverClearance;

    @Column(name = "max_units_per_semester", nullable = false)
    private int maxUnitsPerSemester;

    @Column(name = "registration_opens_at")
    private Instant registrationOpensAt;

    @Column(name = "registration_closes_at")
    private Instant registrationClosesAt;

    protected RegistrationSettings() {
    }

    public RegistrationSettings(String institutionId, boolean requireCarryoverClearance, int maxUnitsPerSemester) {
        this.institutionId = institutionId;
        this.requireCarryoverClearance = requireCarryoverClearance;
        this.maxUnitsPerSemester = maxUnitsPerSemester;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public boolean isRequireCarryoverClearance() {
        return requireCarryoverClearance;
    }

    public void setRequireCarryoverClearance(boolean requireCarryoverClearance) {
        this.requireCarryoverClearance = requireCarryoverClearance;
    }

    public int getMaxUnitsPerSemester() {
        return maxUnitsPerSemester;
    }

    public void setMaxUnitsPerSemester(int maxUnitsPerSemester) {
        this.maxUnitsPerSemester = maxUnitsPerSemester;
    }

    public Instant getRegistrationOpensAt() {
        return registrationOpensAt;
    }

    public void setRegistrationOpensAt(Instant registrationOpensAt) {
        this.registrationOpensAt = registrationOpensAt;
    }

    public Instant getRegistrationClosesAt() {
        return registrationClosesAt;
    }

    public void setRegistrationClosesAt(Instant registrationClosesAt) {
        this.registrationClosesAt = registrationClosesAt;
    }
}

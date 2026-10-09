package com.teducare.registration;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A single institution-wide setting, not a collection — mirrors
 * {@code coursegrade.GradingScale}'s exact shape: {@code institutionId}
 * is the primary key, one row per institution, upserted wholesale by
 * {@code PUT /registration-settings}. Governs how
 * {@code CourseRegistrationService} enforces the carryover-first rule and
 * the total-unit cap — deliberately a per-institution policy rather than
 * a hardcoded rule, since institutions can legitimately want this
 * enforced differently.
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
}

package com.teducare.studentsettings;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A single institution-wide setting, not a collection — mirrors
 * {@code registration.RegistrationSettings}'s exact shape: one row per
 * institution, upserted wholesale by {@code PUT /student-identity-settings}.
 * Governs which identifier the frontend treats as "primary" for a
 * pre-student (matricNo == null): their JAMB registration number, or the
 * system's own auto-generated {@code preAdmissionId}. Both values always
 * exist independently on {@code Student} regardless of this setting — this
 * only controls display preference, not which fields are collected.
 */
@Entity
@Table(name = "student_identity_settings", schema = "dbo")
public class StudentIdentitySettings {

    @Id
    @Column(name = "institution_id", length = 64)
    private String institutionId;

    @Column(name = "pre_student_identifier_preference", nullable = false, length = 30)
    private String preStudentIdentifierPreference;

    /** BCrypt hash of this institution's configured default Student Portal password — null until an admin sets one. Used only by {@code StudentService#resetPasswordToDefault}, which copies this hash directly onto a student's own {@code passwordHash}; never decoded or shown back once set. */
    @Column(name = "default_password_hash", length = 200)
    private String defaultPasswordHash;

    protected StudentIdentitySettings() {
    }

    public StudentIdentitySettings(String institutionId, String preStudentIdentifierPreference) {
        this.institutionId = institutionId;
        this.preStudentIdentifierPreference = preStudentIdentifierPreference;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getPreStudentIdentifierPreference() {
        return preStudentIdentifierPreference;
    }

    public void setPreStudentIdentifierPreference(String preStudentIdentifierPreference) {
        this.preStudentIdentifierPreference = preStudentIdentifierPreference;
    }

    public String getDefaultPasswordHash() {
        return defaultPasswordHash;
    }

    public void setDefaultPasswordHash(String defaultPasswordHash) {
        this.defaultPasswordHash = defaultPasswordHash;
    }
}

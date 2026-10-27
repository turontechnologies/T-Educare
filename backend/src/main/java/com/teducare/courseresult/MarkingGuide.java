package com.teducare.courseresult;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A single institution-wide setting, not a collection — one row per institution, upserted wholesale by {@code PUT /marking-guide}, same shape as {@code coursegrade.GradingScale}. Its components ({@link MarkingGuideComponent}) are a separate child table. */
@Entity
@Table(name = "marking_guides", schema = "dbo")
public class MarkingGuide {

    @Id
    @Column(name = "institution_id", length = 64)
    private String institutionId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MarkingGuide() {
    }

    public MarkingGuide(String institutionId, String name, Instant updatedAt) {
        this.institutionId = institutionId;
        this.name = name;
        this.updatedAt = updatedAt;
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

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

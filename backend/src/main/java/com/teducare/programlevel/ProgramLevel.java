package com.teducare.programlevel;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A small, flat, independent lookup table (API_CONTRACT.md §7.8) —
 * deliberately NOT related to Student.currentLevel or anything in the
 * rollover engine, even though both use similar-looking values. Unifying
 * them is a deliberate, larger follow-up if ever requested, not a
 * default expectation — do not wire this into that engine unprompted.
 */
@Entity
@Table(name = "program_levels", schema = "dbo")
public class ProgramLevel {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "level_code", nullable = false, length = 20)
    private String levelCode;

    @Column(name = "description", nullable = false, length = 150)
    private String description;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected ProgramLevel() {
    }

    public ProgramLevel(
            String id,
            String institutionId,
            String levelCode,
            String description,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.levelCode = levelCode;
        this.description = description;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getLevelCode() {
        return levelCode;
    }

    public void setLevelCode(String levelCode) {
        this.levelCode = levelCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

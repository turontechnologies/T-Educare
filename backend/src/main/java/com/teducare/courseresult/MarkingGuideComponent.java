package com.teducare.courseresult;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One assessment bucket (e.g. "Assignment", weight 10) in the institution's
 * {@link MarkingGuide}. A component's {@code weight} is also its maximum
 * possible score — a score of 8 recorded against a weight-10 component
 * contributes exactly 8 percentage points toward the course's "Overall %",
 * so every result score entry is already pre-scaled and "Overall" is a
 * plain sum, not a weighted average requiring normalization. This is why
 * the Marking Guide Settings dialog validates every institution's
 * components sum to exactly 100.
 */
@Entity
@Table(name = "marking_guide_components", schema = "dbo")
public class MarkingGuideComponent {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "weight", nullable = false, precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected MarkingGuideComponent() {
    }

    public MarkingGuideComponent(
            String id, String institutionId, String name, BigDecimal weight, int displayOrder, Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.name = name;
        this.weight = weight;
        this.displayOrder = displayOrder;
        this.createdAt = createdAt;
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

    public BigDecimal getWeight() {
        return weight;
    }

    public int getDisplayOrder() {
        return displayOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

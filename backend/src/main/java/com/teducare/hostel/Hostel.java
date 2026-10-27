package com.teducare.hostel;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A physical hostel building — its rooms ({@link HostelRoom}) are a
 * separate table, not embedded, since each room has its own capacity and
 * is independently referenced by {@link HostelAllocation}. No archive
 * flag — unlike most resources in this backend, nothing in the design
 * calls for soft-deleting a hostel (there's no delete action on it at
 * all), so one isn't added speculatively.
 */
@Entity
@Table(name = "hostels", schema = "dbo")
public class Hostel {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Hostel() {
    }

    public Hostel(String id, String institutionId, String name, String photoUrl, Instant createdAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.name = name;
        this.photoUrl = photoUrl;
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

    public void setName(String name) {
        this.name = name;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

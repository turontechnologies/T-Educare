package com.teducare.role;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A custom, institution-scoped set of nav-menu permissions (API_CONTRACT.md
 * §12). Deliberately has no "system role" row — an account with no role at
 * all ({@code UserAccount.roleId == null}) is the institution's unrestricted
 * root admin; every real {@code Role} row here is, by definition, a
 * restriction on top of that.
 */
@Entity
@Table(name = "roles", schema = "dbo")
public class Role {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    /** Comma-separated nav keys (see frontend config/nav.ts) this role grants access to. */
    @Column(name = "menu_keys", nullable = false, length = 1000)
    private String menuKeys;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Role() {
    }

    public Role(
            String id,
            String institutionId,
            String name,
            String description,
            String menuKeys,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.name = name;
        this.description = description;
        this.menuKeys = menuKeys;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMenuKeys() {
        return menuKeys;
    }

    public void setMenuKeys(String menuKeys) {
        this.menuKeys = menuKeys;
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

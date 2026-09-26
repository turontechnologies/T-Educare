package com.teducare.auth;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users", schema = "dbo")
public class UserAccount {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "username", nullable = false, unique = true, length = 100)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "role", nullable = false, length = 50)
    private String role;

    @Column(name = "institution_id", length = 64)
    private String institutionId;

    @Column(name = "institution_name")
    private String institutionName;

    @Column(name = "role_id", length = 64)
    private String roleId;

    /** Comma-separated nav keys; null means unrestricted (see AuthenticatedUserDto.menuKeys). */
    @Column(name = "menu_keys", length = 1000)
    private String menuKeys;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    /** Display-only sequential code (e.g. "001") — User Manager accounts only, null for super_admin. */
    @Column(name = "code", length = 10)
    private String code;

    @Column(name = "other_name", length = 100)
    private String otherName;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "is_primary_admin", nullable = false)
    private boolean isPrimaryAdmin;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected UserAccount() {
    }

    public UserAccount(
            String id,
            String username,
            String passwordHash,
            String firstName,
            String lastName,
            String email,
            String role,
            String institutionId,
            String institutionName,
            String roleId,
            String menuKeys,
            String phone,
            String avatarUrl,
            String code,
            String otherName,
            String gender,
            boolean isPrimaryAdmin,
            String status,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.institutionId = institutionId;
        this.institutionName = institutionName;
        this.roleId = roleId;
        this.menuKeys = menuKeys;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
        this.code = code;
        this.otherName = otherName;
        this.gender = gender;
        this.isPrimaryAdmin = isPrimaryAdmin;
        this.status = status;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public void setInstitutionId(String institutionId) {
        this.institutionId = institutionId;
    }

    public String getInstitutionName() {
        return institutionName;
    }

    public void setInstitutionName(String institutionName) {
        this.institutionName = institutionName;
    }

    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String roleId) {
        this.roleId = roleId;
    }

    public String getMenuKeys() {
        return menuKeys;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getCode() {
        return code;
    }

    public String getOtherName() {
        return otherName;
    }

    public void setOtherName(String otherName) {
        this.otherName = otherName;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public boolean isPrimaryAdmin() {
        return isPrimaryAdmin;
    }

    public void setPrimaryAdmin(boolean primaryAdmin) {
        this.isPrimaryAdmin = primaryAdmin;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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

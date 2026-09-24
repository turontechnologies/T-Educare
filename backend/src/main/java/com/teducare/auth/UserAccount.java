package com.teducare.auth;

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
            String avatarUrl) {
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
    }

    public String getId() {
        return id;
    }

    public String getUsername() {
        return username;
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

    public String getInstitutionName() {
        return institutionName;
    }

    public String getRoleId() {
        return roleId;
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
}

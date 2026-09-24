package com.teducare.institution;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "institutions", schema = "dbo")
public class Institution {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "code", nullable = false, unique = true, length = 10)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "institution_type", nullable = false, length = 50)
    private String institutionType;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "country_state", length = 100)
    private String countryState;

    @Column(name = "principal_name")
    private String principalName;

    @Column(name = "principal_email")
    private String principalEmail;

    @Column(name = "principal_phone", length = 30)
    private String principalPhone;

    @Column(name = "admin_user")
    private String adminUser;

    @Column(name = "admin_email")
    private String adminEmail;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    /** Comma-separated module keys from the platform catalog; empty/null means unlinked. */
    @Column(name = "module_keys", length = 1000)
    private String moduleKeys;

    @Column(name = "modules_last_edited_at")
    private Instant modulesLastEditedAt;

    /** Always derived as moduleKeys.length — never set independently. */
    @Column(name = "modules_count", nullable = false)
    private int modulesCount;

    @Column(name = "student_count", nullable = false)
    private int studentCount;

    @Column(name = "revenue", nullable = false)
    private long revenue;

    @Column(name = "license_type", nullable = false, length = 20)
    private String licenseType;

    @Column(name = "expiring_at")
    private Instant expiringAt;

    @Column(name = "token_key", nullable = false, length = 50)
    private String tokenKey;

    @Column(name = "license_key", length = 50)
    private String licenseKey;

    @Column(name = "license_issued_at")
    private Instant licenseIssuedAt;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Institution() {
    }

    public Institution(
            String id,
            String code,
            String name,
            String institutionType,
            String address,
            String city,
            String countryState,
            String principalName,
            String principalEmail,
            String principalPhone,
            String adminUser,
            String adminEmail,
            String logoUrl,
            String moduleKeys,
            Instant modulesLastEditedAt,
            int modulesCount,
            int studentCount,
            long revenue,
            String licenseType,
            Instant expiringAt,
            String tokenKey,
            String licenseKey,
            Instant licenseIssuedAt,
            String status,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.institutionType = institutionType;
        this.address = address;
        this.city = city;
        this.countryState = countryState;
        this.principalName = principalName;
        this.principalEmail = principalEmail;
        this.principalPhone = principalPhone;
        this.adminUser = adminUser;
        this.adminEmail = adminEmail;
        this.logoUrl = logoUrl;
        this.moduleKeys = moduleKeys;
        this.modulesLastEditedAt = modulesLastEditedAt;
        this.modulesCount = modulesCount;
        this.studentCount = studentCount;
        this.revenue = revenue;
        this.licenseType = licenseType;
        this.expiringAt = expiringAt;
        this.tokenKey = tokenKey;
        this.licenseKey = licenseKey;
        this.licenseIssuedAt = licenseIssuedAt;
        this.status = status;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getInstitutionType() {
        return institutionType;
    }

    public void setInstitutionType(String institutionType) {
        this.institutionType = institutionType;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCountryState() {
        return countryState;
    }

    public void setCountryState(String countryState) {
        this.countryState = countryState;
    }

    public String getPrincipalName() {
        return principalName;
    }

    public void setPrincipalName(String principalName) {
        this.principalName = principalName;
    }

    public String getPrincipalEmail() {
        return principalEmail;
    }

    public void setPrincipalEmail(String principalEmail) {
        this.principalEmail = principalEmail;
    }

    public String getPrincipalPhone() {
        return principalPhone;
    }

    public void setPrincipalPhone(String principalPhone) {
        this.principalPhone = principalPhone;
    }

    public String getAdminUser() {
        return adminUser;
    }

    public void setAdminUser(String adminUser) {
        this.adminUser = adminUser;
    }

    public String getAdminEmail() {
        return adminEmail;
    }

    public void setAdminEmail(String adminEmail) {
        this.adminEmail = adminEmail;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getModuleKeys() {
        return moduleKeys;
    }

    public void setModuleKeys(String moduleKeys) {
        this.moduleKeys = moduleKeys;
    }

    public Instant getModulesLastEditedAt() {
        return modulesLastEditedAt;
    }

    public void setModulesLastEditedAt(Instant modulesLastEditedAt) {
        this.modulesLastEditedAt = modulesLastEditedAt;
    }

    public int getModulesCount() {
        return modulesCount;
    }

    public void setModulesCount(int modulesCount) {
        this.modulesCount = modulesCount;
    }

    public int getStudentCount() {
        return studentCount;
    }

    public void setStudentCount(int studentCount) {
        this.studentCount = studentCount;
    }

    public long getRevenue() {
        return revenue;
    }

    public void setRevenue(long revenue) {
        this.revenue = revenue;
    }

    public String getLicenseType() {
        return licenseType;
    }

    public void setLicenseType(String licenseType) {
        this.licenseType = licenseType;
    }

    public Instant getExpiringAt() {
        return expiringAt;
    }

    public void setExpiringAt(Instant expiringAt) {
        this.expiringAt = expiringAt;
    }

    public String getTokenKey() {
        return tokenKey;
    }

    public String getLicenseKey() {
        return licenseKey;
    }

    public void setLicenseKey(String licenseKey) {
        this.licenseKey = licenseKey;
    }

    public Instant getLicenseIssuedAt() {
        return licenseIssuedAt;
    }

    public void setLicenseIssuedAt(Instant licenseIssuedAt) {
        this.licenseIssuedAt = licenseIssuedAt;
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

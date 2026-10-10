package com.teducare.staff;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Full staff profile (API_CONTRACT.md §8.1). {@code roleId}/
 * {@code designationId}/{@code departmentId} are real, independently
 * validated FKs — the pre-backend mock had {@code role}/{@code designation}
 * as free text (both checked against the same Staff Designation list by
 * name); these are now both real FKs into {@code StaffDesignation.id},
 * matching how every other multi-FK resource in this app was upgraded
 * (Students, Courses). {@code salaryAmount}/{@code salaryCurrency} are
 * nullable — not every institution tracks pay through this screen.
 */
@Entity
@Table(name = "staff_members", schema = "dbo")
public class StaffMember {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "staff_id", nullable = false, length = 50)
    private String staffId;

    @Column(name = "role_id", nullable = false, length = 64)
    private String roleId;

    @Column(name = "designation_id", nullable = false, length = 64)
    private String designationId;

    @Column(name = "department_id", nullable = false, length = 64)
    private String departmentId;

    @Column(name = "gender", nullable = false, length = 20)
    private String gender;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "other_name", length = 100)
    private String otherName;

    @Column(name = "marital_status", nullable = false, length = 20)
    private String maritalStatus;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "phone", nullable = false, length = 30)
    private String phone;

    @Column(name = "emergency_contact", nullable = false, length = 150)
    private String emergencyContact;

    @Column(name = "date_of_birth", nullable = false)
    private Instant dateOfBirth;

    @Column(name = "employment_start_date", nullable = false)
    private Instant employmentStartDate;

    @Column(name = "contact_address", nullable = false, length = 500)
    private String contactAddress;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "salary_amount", precision = 14, scale = 2)
    private BigDecimal salaryAmount;

    @Column(name = "salary_currency", length = 10)
    private String salaryCurrency;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected StaffMember() {
    }

    public StaffMember(
            String id,
            String institutionId,
            String staffId,
            String roleId,
            String designationId,
            String departmentId,
            String gender,
            String firstName,
            String middleName,
            String lastName,
            String otherName,
            String maritalStatus,
            String email,
            String phone,
            String emergencyContact,
            Instant dateOfBirth,
            Instant employmentStartDate,
            String contactAddress,
            String avatarUrl,
            BigDecimal salaryAmount,
            String salaryCurrency,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.staffId = staffId;
        this.roleId = roleId;
        this.designationId = designationId;
        this.departmentId = departmentId;
        this.gender = gender;
        this.firstName = firstName;
        this.middleName = middleName;
        this.lastName = lastName;
        this.otherName = otherName;
        this.maritalStatus = maritalStatus;
        this.email = email;
        this.phone = phone;
        this.emergencyContact = emergencyContact;
        this.dateOfBirth = dateOfBirth;
        this.employmentStartDate = employmentStartDate;
        this.contactAddress = contactAddress;
        this.avatarUrl = avatarUrl;
        this.salaryAmount = salaryAmount;
        this.salaryCurrency = salaryCurrency;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getStaffId() {
        return staffId;
    }

    public void setStaffId(String staffId) {
        this.staffId = staffId;
    }

    public String getRoleId() {
        return roleId;
    }

    public void setRoleId(String roleId) {
        this.roleId = roleId;
    }

    public String getDesignationId() {
        return designationId;
    }

    public void setDesignationId(String designationId) {
        this.designationId = designationId;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getMiddleName() {
        return middleName;
    }

    public void setMiddleName(String middleName) {
        this.middleName = middleName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getOtherName() {
        return otherName;
    }

    public void setOtherName(String otherName) {
        this.otherName = otherName;
    }

    public String getMaritalStatus() {
        return maritalStatus;
    }

    public void setMaritalStatus(String maritalStatus) {
        this.maritalStatus = maritalStatus;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(String emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public Instant getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(Instant dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public Instant getEmploymentStartDate() {
        return employmentStartDate;
    }

    public void setEmploymentStartDate(Instant employmentStartDate) {
        this.employmentStartDate = employmentStartDate;
    }

    public String getContactAddress() {
        return contactAddress;
    }

    public void setContactAddress(String contactAddress) {
        this.contactAddress = contactAddress;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public BigDecimal getSalaryAmount() {
        return salaryAmount;
    }

    public void setSalaryAmount(BigDecimal salaryAmount) {
        this.salaryAmount = salaryAmount;
    }

    public String getSalaryCurrency() {
        return salaryCurrency;
    }

    public void setSalaryCurrency(String salaryCurrency) {
        this.salaryCurrency = salaryCurrency;
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

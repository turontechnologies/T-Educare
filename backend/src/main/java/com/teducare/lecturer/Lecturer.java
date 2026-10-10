package com.teducare.lecturer;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Lecture Management's own resource (API_CONTRACT.md) — deliberately not a
 * view over {@code StaffMember}: a lecturer's academic rank
 * ({@code position}) and organizational assignment ({@code assignmentType}/
 * {@code assignmentId}, posted directly to a School or a Faculty) are
 * concepts this page needs independently of the general HR Staff
 * Designation list, matching the pre-backend mock's own
 * {@code types/lecturer.ts} shape exactly.
 */
@Entity
@Table(name = "lecturers", schema = "dbo")
public class Lecturer {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "username", nullable = false, length = 50)
    private String username;

    @Column(name = "position", nullable = false, length = 50)
    private String position;

    /** "school" | "faculty" — which table {@code assignmentId} points into. */
    @Column(name = "assignment_type", nullable = false, length = 10)
    private String assignmentType;

    @Column(name = "assignment_id", nullable = false, length = 64)
    private String assignmentId;

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

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "phone", nullable = false, length = 30)
    private String phone;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Lecturer() {
    }

    public Lecturer(
            String id,
            String institutionId,
            String username,
            String position,
            String assignmentType,
            String assignmentId,
            String gender,
            String firstName,
            String middleName,
            String lastName,
            String otherName,
            String email,
            String phone,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.username = username;
        this.position = position;
        this.assignmentType = assignmentType;
        this.assignmentId = assignmentId;
        this.gender = gender;
        this.firstName = firstName;
        this.middleName = middleName;
        this.lastName = lastName;
        this.otherName = otherName;
        this.email = email;
        this.phone = phone;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getAssignmentType() {
        return assignmentType;
    }

    public void setAssignmentType(String assignmentType) {
        this.assignmentType = assignmentType;
    }

    public String getAssignmentId() {
        return assignmentId;
    }

    public void setAssignmentId(String assignmentId) {
        this.assignmentId = assignmentId;
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

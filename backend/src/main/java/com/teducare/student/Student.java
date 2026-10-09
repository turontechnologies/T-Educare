package com.teducare.student;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Comprehensive student profile (API_CONTRACT.md §7.13) — every field the
 * pre-backend mock already had (`frontend/src/types/student.ts`), plus a
 * new medical-history section. `schoolId`/`facultyId`/`departmentId`/
 * `programId`/`programLevelId` (current level) are all real, independent
 * FKs — the mock had `faculty`/`department`/`programme` as free text and
 * `currentLevel` as a fixed string union; this ties all four to the real
 * Academics hierarchy instead, per explicit instruction. Each is validated
 * independently in {@link StudentService}, none derived through another —
 * same convention as every other multi-FK resource in this hierarchy
 * (Courses, Programs, Departments).
 */
@Entity
@Table(name = "students", schema = "dbo")
public class Student {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "institution_id", nullable = false, length = 64)
    private String institutionId;

    @Column(name = "matric_no", nullable = false, length = 50)
    private String matricNo;

    @Column(name = "title", nullable = false, length = 20)
    private String title;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "other_name", length = 100)
    private String otherName;

    @Column(name = "gender", nullable = false, length = 20)
    private String gender;

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

    @Column(name = "religion", nullable = false, length = 20)
    private String religion;

    @Column(name = "maiden_name", length = 100)
    private String maidenName;

    @Column(name = "blood_group", nullable = false, length = 5)
    private String bloodGroup;

    @Column(name = "genotype", nullable = false, length = 5)
    private String genotype;

    @Column(name = "weight_kg", nullable = false)
    private double weightKg;

    @Column(name = "height_cm", nullable = false)
    private double heightCm;

    @Column(name = "nationality", nullable = false, length = 100)
    private String nationality;

    @Column(name = "state_of_origin", nullable = false, length = 100)
    private String stateOfOrigin;

    @Column(name = "lga", nullable = false, length = 100)
    private String lga;

    @Column(name = "resident_address", nullable = false, length = 500)
    private String residentAddress;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "school_id", nullable = false, length = 64)
    private String schoolId;

    @Column(name = "faculty_id", nullable = false, length = 64)
    private String facultyId;

    @Column(name = "department_id", nullable = false, length = 64)
    private String departmentId;

    @Column(name = "program_id", nullable = false, length = 64)
    private String programId;

    /** The student's CURRENT level — distinct from a historical level recorded on a {@link StudentAcademicRecord}. */
    @Column(name = "program_level_id", nullable = false, length = 64)
    private String programLevelId;

    @Column(name = "current_session_id", nullable = false, length = 64)
    private String currentSessionId;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "is_graduating", nullable = false)
    private boolean isGraduating;

    @Column(name = "is_deferred", nullable = false)
    private boolean isDeferred;

    @Column(name = "hold_for_review", nullable = false)
    private boolean holdForReview;

    // --- Medical history — new, not present in the pre-backend mock. ---

    @Column(name = "allergies", length = 1000)
    private String allergies;

    @Column(name = "chronic_conditions", length = 1000)
    private String chronicConditions;

    @Column(name = "current_medications", length = 1000)
    private String currentMedications;

    @Column(name = "past_surgeries", length = 1000)
    private String pastSurgeries;

    @Column(name = "physician_name", length = 150)
    private String physicianName;

    @Column(name = "physician_phone", length = 30)
    private String physicianPhone;

    @Column(name = "health_insurance_provider", length = 150)
    private String healthInsuranceProvider;

    @Column(name = "health_insurance_number", length = 100)
    private String healthInsuranceNumber;

    @Column(name = "medical_notes", length = 2000)
    private String medicalNotes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Student() {
    }

    public Student(
            String id,
            String institutionId,
            String matricNo,
            String title,
            String firstName,
            String middleName,
            String lastName,
            String otherName,
            String gender,
            String maritalStatus,
            String email,
            String phone,
            String emergencyContact,
            Instant dateOfBirth,
            String religion,
            String maidenName,
            String bloodGroup,
            String genotype,
            double weightKg,
            double heightCm,
            String nationality,
            String stateOfOrigin,
            String lga,
            String residentAddress,
            String avatarUrl,
            String schoolId,
            String facultyId,
            String departmentId,
            String programId,
            String programLevelId,
            String currentSessionId,
            String status,
            boolean isGraduating,
            boolean isDeferred,
            boolean holdForReview,
            String allergies,
            String chronicConditions,
            String currentMedications,
            String pastSurgeries,
            String physicianName,
            String physicianPhone,
            String healthInsuranceProvider,
            String healthInsuranceNumber,
            String medicalNotes,
            Instant createdAt,
            Instant archivedAt) {
        this.id = id;
        this.institutionId = institutionId;
        this.matricNo = matricNo;
        this.title = title;
        this.firstName = firstName;
        this.middleName = middleName;
        this.lastName = lastName;
        this.otherName = otherName;
        this.gender = gender;
        this.maritalStatus = maritalStatus;
        this.email = email;
        this.phone = phone;
        this.emergencyContact = emergencyContact;
        this.dateOfBirth = dateOfBirth;
        this.religion = religion;
        this.maidenName = maidenName;
        this.bloodGroup = bloodGroup;
        this.genotype = genotype;
        this.weightKg = weightKg;
        this.heightCm = heightCm;
        this.nationality = nationality;
        this.stateOfOrigin = stateOfOrigin;
        this.lga = lga;
        this.residentAddress = residentAddress;
        this.avatarUrl = avatarUrl;
        this.schoolId = schoolId;
        this.facultyId = facultyId;
        this.departmentId = departmentId;
        this.programId = programId;
        this.programLevelId = programLevelId;
        this.currentSessionId = currentSessionId;
        this.status = status;
        this.isGraduating = isGraduating;
        this.isDeferred = isDeferred;
        this.holdForReview = holdForReview;
        this.allergies = allergies;
        this.chronicConditions = chronicConditions;
        this.currentMedications = currentMedications;
        this.pastSurgeries = pastSurgeries;
        this.physicianName = physicianName;
        this.physicianPhone = physicianPhone;
        this.healthInsuranceProvider = healthInsuranceProvider;
        this.healthInsuranceNumber = healthInsuranceNumber;
        this.medicalNotes = medicalNotes;
        this.createdAt = createdAt;
        this.archivedAt = archivedAt;
    }

    public String getId() {
        return id;
    }

    public String getInstitutionId() {
        return institutionId;
    }

    public String getMatricNo() {
        return matricNo;
    }

    public void setMatricNo(String matricNo) {
        this.matricNo = matricNo;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
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

    public String getReligion() {
        return religion;
    }

    public void setReligion(String religion) {
        this.religion = religion;
    }

    public String getMaidenName() {
        return maidenName;
    }

    public void setMaidenName(String maidenName) {
        this.maidenName = maidenName;
    }

    public String getBloodGroup() {
        return bloodGroup;
    }

    public void setBloodGroup(String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public String getGenotype() {
        return genotype;
    }

    public void setGenotype(String genotype) {
        this.genotype = genotype;
    }

    public double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(double weightKg) {
        this.weightKg = weightKg;
    }

    public double getHeightCm() {
        return heightCm;
    }

    public void setHeightCm(double heightCm) {
        this.heightCm = heightCm;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getStateOfOrigin() {
        return stateOfOrigin;
    }

    public void setStateOfOrigin(String stateOfOrigin) {
        this.stateOfOrigin = stateOfOrigin;
    }

    public String getLga() {
        return lga;
    }

    public void setLga(String lga) {
        this.lga = lga;
    }

    public String getResidentAddress() {
        return residentAddress;
    }

    public void setResidentAddress(String residentAddress) {
        this.residentAddress = residentAddress;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(String schoolId) {
        this.schoolId = schoolId;
    }

    public String getFacultyId() {
        return facultyId;
    }

    public void setFacultyId(String facultyId) {
        this.facultyId = facultyId;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public String getProgramId() {
        return programId;
    }

    public void setProgramId(String programId) {
        this.programId = programId;
    }

    public String getProgramLevelId() {
        return programLevelId;
    }

    public void setProgramLevelId(String programLevelId) {
        this.programLevelId = programLevelId;
    }

    public String getCurrentSessionId() {
        return currentSessionId;
    }

    public void setCurrentSessionId(String currentSessionId) {
        this.currentSessionId = currentSessionId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isGraduating() {
        return isGraduating;
    }

    public void setGraduating(boolean graduating) {
        isGraduating = graduating;
    }

    public boolean isDeferred() {
        return isDeferred;
    }

    public void setDeferred(boolean deferred) {
        isDeferred = deferred;
    }

    public boolean isHoldForReview() {
        return holdForReview;
    }

    public void setHoldForReview(boolean holdForReview) {
        this.holdForReview = holdForReview;
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getChronicConditions() {
        return chronicConditions;
    }

    public void setChronicConditions(String chronicConditions) {
        this.chronicConditions = chronicConditions;
    }

    public String getCurrentMedications() {
        return currentMedications;
    }

    public void setCurrentMedications(String currentMedications) {
        this.currentMedications = currentMedications;
    }

    public String getPastSurgeries() {
        return pastSurgeries;
    }

    public void setPastSurgeries(String pastSurgeries) {
        this.pastSurgeries = pastSurgeries;
    }

    public String getPhysicianName() {
        return physicianName;
    }

    public void setPhysicianName(String physicianName) {
        this.physicianName = physicianName;
    }

    public String getPhysicianPhone() {
        return physicianPhone;
    }

    public void setPhysicianPhone(String physicianPhone) {
        this.physicianPhone = physicianPhone;
    }

    public String getHealthInsuranceProvider() {
        return healthInsuranceProvider;
    }

    public void setHealthInsuranceProvider(String healthInsuranceProvider) {
        this.healthInsuranceProvider = healthInsuranceProvider;
    }

    public String getHealthInsuranceNumber() {
        return healthInsuranceNumber;
    }

    public void setHealthInsuranceNumber(String healthInsuranceNumber) {
        this.healthInsuranceNumber = healthInsuranceNumber;
    }

    public String getMedicalNotes() {
        return medicalNotes;
    }

    public void setMedicalNotes(String medicalNotes) {
        this.medicalNotes = medicalNotes;
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

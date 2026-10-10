package com.teducare.student;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** `matricNo` is intentionally optional — a student created without one is a "pre-student" (just admitted, not yet matriculated); assigning one later via a normal update is how they become a full student. */
public record CreateStudentRequest(
        String matricNo,
        String jambRegNumber,
        @NotBlank(message = "Admission mode is required.") String admissionMode,
        @NotBlank(message = "Title is required.") String title,
        @NotBlank(message = "First name is required.") String firstName,
        String middleName,
        @NotBlank(message = "Last name is required.") String lastName,
        String otherName,
        @NotBlank(message = "Gender is required.") String gender,
        @NotBlank(message = "Marital status is required.") String maritalStatus,
        @NotBlank(message = "Email is required.") String email,
        @NotBlank(message = "Phone is required.") String phone,
        @NotBlank(message = "Emergency contact is required.") String emergencyContact,
        @NotNull(message = "Date of birth is required.") Instant dateOfBirth,
        @NotBlank(message = "Religion is required.") String religion,
        String maidenName,
        @NotBlank(message = "Blood group is required.") String bloodGroup,
        @NotBlank(message = "Genotype is required.") String genotype,
        @NotNull(message = "Weight is required.") Double weightKg,
        @NotNull(message = "Height is required.") Double heightCm,
        @NotBlank(message = "Nationality is required.") String nationality,
        @NotBlank(message = "State of origin is required.") String stateOfOrigin,
        @NotBlank(message = "LGA is required.") String lga,
        @NotBlank(message = "Resident address is required.") String residentAddress,
        String avatarUrl,
        @NotBlank(message = "School is required.") String schoolId,
        @NotBlank(message = "Faculty is required.") String facultyId,
        @NotBlank(message = "Department is required.") String departmentId,
        @NotBlank(message = "Program is required.") String programId,
        @NotBlank(message = "Program level is required.") String programLevelId,
        @NotBlank(message = "Current session is required.") String currentSessionId,
        String hostelName,
        String roomNumber,
        String allergies,
        String chronicConditions,
        String currentMedications,
        String pastSurgeries,
        String physicianName,
        String physicianPhone,
        String healthInsuranceProvider,
        String healthInsuranceNumber,
        String medicalNotes) {
}

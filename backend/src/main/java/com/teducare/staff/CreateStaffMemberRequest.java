package com.teducare.staff;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateStaffMemberRequest(
        @NotBlank(message = "Staff ID is required.") String staffId,
        @NotBlank(message = "Role is required.") String roleId,
        @NotBlank(message = "Designation is required.") String designationId,
        @NotBlank(message = "Department is required.") String departmentId,
        @NotBlank(message = "Gender is required.") String gender,
        @NotBlank(message = "First name is required.") String firstName,
        String middleName,
        @NotBlank(message = "Last name is required.") String lastName,
        String otherName,
        @NotBlank(message = "Marital status is required.") String maritalStatus,
        @NotBlank(message = "Email is required.") String email,
        @NotBlank(message = "Phone is required.") String phone,
        @NotBlank(message = "Emergency contact is required.") String emergencyContact,
        @NotNull(message = "Date of birth is required.") Instant dateOfBirth,
        @NotNull(message = "Employment start date is required.") Instant employmentStartDate,
        @NotBlank(message = "Contact address is required.") String contactAddress,
        String avatarUrl,
        BigDecimal salaryAmount,
        String salaryCurrency) {
}

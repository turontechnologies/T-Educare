package com.teducare.staff;

import java.math.BigDecimal;
import java.time.Instant;

/** Any field left null keeps its current value — same partial-update convention as UpdateStudentRequest. */
public record UpdateStaffMemberRequest(
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
        String salaryCurrency) {
}

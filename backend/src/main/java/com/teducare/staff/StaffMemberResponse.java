package com.teducare.staff;

import java.math.BigDecimal;
import java.time.Instant;

public record StaffMemberResponse(
        String id,
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

    static StaffMemberResponse from(StaffMember s) {
        return new StaffMemberResponse(
                s.getId(),
                s.getStaffId(),
                s.getRoleId(),
                s.getDesignationId(),
                s.getDepartmentId(),
                s.getGender(),
                s.getFirstName(),
                s.getMiddleName(),
                s.getLastName(),
                s.getOtherName(),
                s.getMaritalStatus(),
                s.getEmail(),
                s.getPhone(),
                s.getEmergencyContact(),
                s.getDateOfBirth(),
                s.getEmploymentStartDate(),
                s.getContactAddress(),
                s.getAvatarUrl(),
                s.getSalaryAmount(),
                s.getSalaryCurrency(),
                s.getCreatedAt(),
                s.getArchivedAt());
    }
}

package com.teducare.staff;

import java.time.Instant;

public record StaffQualificationResponse(
        String id,
        String staffId,
        String degree,
        String fieldOfStudy,
        String institutionAttended,
        Integer yearObtained,
        Instant createdAt) {

    static StaffQualificationResponse from(StaffQualification q) {
        return new StaffQualificationResponse(
                q.getId(),
                q.getStaffId(),
                q.getDegree(),
                q.getFieldOfStudy(),
                q.getInstitutionAttended(),
                q.getYearObtained(),
                q.getCreatedAt());
    }
}

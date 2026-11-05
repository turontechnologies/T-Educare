package com.teducare.studentauth;

import com.teducare.institution.Institution;
import com.teducare.student.Student;

/** Just enough for the Student Portal's header/sidebar (own identity + tenant branding) — the fuller academic/bills/hostel picture is fetched separately by the dashboard's own data endpoints, not bundled into login. */
public record StudentAuthProfileResponse(
        String id,
        String matricNo,
        String preAdmissionId,
        String firstName,
        String lastName,
        String email,
        String avatarUrl,
        String institutionId,
        String institutionName,
        String institutionSlug,
        String institutionLogoUrl,
        String institutionBrandColor) {

    static StudentAuthProfileResponse from(Student student, Institution institution) {
        return new StudentAuthProfileResponse(
                student.getId(),
                student.getMatricNo(),
                student.getPreAdmissionId(),
                student.getFirstName(),
                student.getLastName(),
                student.getEmail(),
                student.getAvatarUrl(),
                institution.getId(),
                institution.getName(),
                institution.getSlug(),
                institution.getLogoUrl(),
                institution.getBrandColor());
    }
}

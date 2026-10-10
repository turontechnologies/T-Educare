package com.teducare.staff;

import jakarta.validation.constraints.NotBlank;

public record AddStaffQualificationRequest(
        @NotBlank(message = "Degree is required.") String degree,
        @NotBlank(message = "Field of study is required.") String fieldOfStudy,
        @NotBlank(message = "Institution attended is required.") String institutionAttended,
        Integer yearObtained) {
}

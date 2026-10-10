package com.teducare.studentsettings;

import jakarta.validation.constraints.NotBlank;

public record UpdateStudentIdentitySettingsRequest(
        @NotBlank(message = "preStudentIdentifierPreference is required.") String preStudentIdentifierPreference) {
}

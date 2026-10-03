package com.teducare.programlevel;

import jakarta.validation.constraints.NotBlank;

public record CreateProgramLevelRequest(
        @NotBlank(message = "Level code is required.") String levelCode,
        @NotBlank(message = "Description is required.") String description) {
}

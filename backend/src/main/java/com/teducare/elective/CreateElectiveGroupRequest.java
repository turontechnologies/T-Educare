package com.teducare.elective;

import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record CreateElectiveGroupRequest(
        @NotBlank(message = "Department is required.") String departmentId,
        @NotBlank(message = "Program level is required.") String programLevelId,
        @NotBlank(message = "Name is required.") String name,
        @NotNull(message = "Minimum selection is required.") @Min(value = 1, message = "Minimum selection must be at least 1.")
        Integer minSelect,
        @NotNull(message = "Maximum selection is required.") @Min(value = 1, message = "Maximum selection must be at least 1.")
        Integer maxSelect,
        @NotEmpty(message = "At least two courses are required to form a group.") List<String> courseIds) {
}

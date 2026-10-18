package com.teducare.leave;

import jakarta.validation.constraints.NotBlank;

public record CreateLeaveTypeRequest(
        @NotBlank(message = "name is required.") String name,
        Integer defaultDaysPerYear,
        Boolean rollover,
        Integer maxRolloverDays) {
}

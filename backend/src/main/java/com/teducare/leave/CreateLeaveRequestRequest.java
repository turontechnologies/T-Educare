package com.teducare.leave;

import jakarta.validation.constraints.NotBlank;

public record CreateLeaveRequestRequest(
        @NotBlank(message = "leaveTypeId is required.") String leaveTypeId,
        @NotBlank(message = "startDate is required.") String startDate,
        @NotBlank(message = "endDate is required.") String endDate,
        @NotBlank(message = "A reason is required.") String reason) {
}

package com.teducare.attendance;

import jakarta.validation.constraints.NotBlank;

public record CreateAttendanceDeviceRequest(
        @NotBlank(message = "Device name is required.") String name,
        String location) {
}

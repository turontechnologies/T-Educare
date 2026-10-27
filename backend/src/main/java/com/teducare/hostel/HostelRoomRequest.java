package com.teducare.hostel;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record HostelRoomRequest(
        @NotBlank(message = "Room number is required.") String roomNumber,
        @NotNull(message = "Capacity is required.") @Min(value = 1, message = "Capacity must be at least 1.")
        Integer capacity) {
}

package com.teducare.hostel;

import jakarta.validation.constraints.NotBlank;

/** Body for both {@code /propose} (WAITLIST -> PENDING_ALLOCATION) and {@code /confirm} (-> ALLOCATED) — same shape, different resulting status, per {@code HostelAllocationService}. */
public record AssignRoomRequest(
        @NotBlank(message = "Hostel is required.") String hostelId,
        @NotBlank(message = "Room is required.") String roomId) {
}

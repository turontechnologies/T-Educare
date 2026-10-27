package com.teducare.hostel;

import jakarta.validation.constraints.NotBlank;

/** "Add Student" — creates a new PENDING_ALLOCATION with a tentative hostel/room pick, which an admin later confirms via {@code POST /hostel-allocations/:id/confirm}. */
public record AddHostelAllocationRequest(
        @NotBlank(message = "Student is required.") String studentId,
        @NotBlank(message = "Hostel is required.") String hostelId,
        @NotBlank(message = "Room is required.") String roomId) {
}

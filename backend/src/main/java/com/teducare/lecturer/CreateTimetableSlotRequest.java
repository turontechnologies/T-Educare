package com.teducare.lecturer;

import jakarta.validation.constraints.NotBlank;

public record CreateTimetableSlotRequest(
        @NotBlank(message = "Day of week is required.") String dayOfWeek,
        @NotBlank(message = "Start time is required.") String startTime,
        @NotBlank(message = "End time is required.") String endTime,
        @NotBlank(message = "Venue is required.") String venue) {
}

package com.teducare.lecturer;

import jakarta.validation.constraints.NotBlank;

/** A lecturer proposing a different day/time (and optionally venue) for one of their own timetable slots. */
public record RequestTimetableChangeRequest(
        @NotBlank(message = "Timetable slot is required.") String timetableSlotId,
        @NotBlank(message = "Proposed day of week is required.") String proposedDayOfWeek,
        @NotBlank(message = "Proposed start time is required.") String proposedStartTime,
        @NotBlank(message = "Proposed end time is required.") String proposedEndTime,
        String proposedVenue,
        @NotBlank(message = "A reason is required.") String reason) {
}

package com.teducare.attendance;

import jakarta.validation.constraints.NotBlank;

/** An admin recording a clock event by hand — e.g. the device was down, or a staff member forgot to tap. A reason is required, same audit convention as a disciplinary action. */
public record RecordManualAttendanceRequest(
        @NotBlank(message = "staffId is required.") String staffId,
        @NotBlank(message = "eventType is required.") String eventType,
        @NotBlank(message = "occurredAt is required.") String occurredAt,
        @NotBlank(message = "A note is required for a manual entry.") String note) {
}

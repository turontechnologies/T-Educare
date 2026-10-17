package com.teducare.attendance;

import jakarta.validation.constraints.NotBlank;

/**
 * The payload a biometric device (or its middleware) pushes on every tap.
 * {@code staffId} is this institution's own real {@code StaffMember.staffId}
 * (the human-readable code already shown throughout Staff Management) —
 * the device/middleware is configured with the same ids as its enrolled
 * users' "employee ID" field, so no separate enrollment step exists on our
 * side. {@code occurredAt} is optional; omitted, the server's own receipt
 * time is used (the common case — a real-time push).
 */
public record ClockEventRequest(
        @NotBlank(message = "staffId is required.") String staffId,
        @NotBlank(message = "eventType is required.") String eventType,
        String occurredAt) {
}

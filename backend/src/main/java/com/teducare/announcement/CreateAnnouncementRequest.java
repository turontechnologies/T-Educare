package com.teducare.announcement;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

/**
 * {@code action} mirrors the three dialog buttons exactly: "SEND" (-> SENT
 * immediately), "SCHEDULE" (-> SCHEDULED, requires {@code scheduledFor}),
 * or "DRAFT" (-> DRAFT, saved as-is). At least one of {@code sendViaApp}/
 * {@code sendViaEmail} is required. {@code targetValue} is validated
 * against {@code targetScope} by {@code AnnouncementService} — see its own
 * doc comment for what each scope accepts.
 */
public record CreateAnnouncementRequest(
        @NotBlank(message = "Headline is required.") String headline,
        @NotBlank(message = "Body is required.") String body,
        boolean sendViaApp,
        boolean sendViaEmail,
        @NotBlank(message = "Target scope is required.") String targetScope,
        String targetValue,
        @Valid List<AttachmentRequest> attachments,
        @NotBlank(message = "Action is required.") String action,
        String scheduledFor) {
}

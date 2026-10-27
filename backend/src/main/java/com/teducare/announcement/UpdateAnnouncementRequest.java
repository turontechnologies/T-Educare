package com.teducare.announcement;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

/** Same shape and {@code action} semantics as {@link CreateAnnouncementRequest} — "Edit" on a DRAFT or SCHEDULED announcement re-opens the same dialog, able to re-save as a draft, (re)schedule, or send immediately. Editing a SENT announcement isn't offered in the UI and isn't accepted here (409 — see {@code AnnouncementService.update}). */
public record UpdateAnnouncementRequest(
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

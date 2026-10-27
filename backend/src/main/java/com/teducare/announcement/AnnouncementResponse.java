package com.teducare.announcement;

import java.time.Instant;
import java.util.List;

/** {@code targetLabel} is resolved at read time (never stored) — e.g. "100 Level students" or "Maple Hall residents". */
public record AnnouncementResponse(
        String id,
        String headline,
        String body,
        boolean sendViaApp,
        boolean sendViaEmail,
        String targetScope,
        String targetValue,
        String targetLabel,
        String status,
        Instant scheduledFor,
        Instant sentAt,
        String createdByName,
        List<AttachmentResponse> attachments,
        Instant createdAt,
        Instant updatedAt) {
}

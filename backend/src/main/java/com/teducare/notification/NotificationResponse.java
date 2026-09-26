package com.teducare.notification;

import java.time.Instant;

/** Never exposes scopeType/scopeInstitutionId/scopeUserId — internal-only, same convention as AuthDirectory.Account not serializing status/archivedAt. */
public record NotificationResponse(
        String id, String title, String message, String href, Instant createdAt, boolean read) {

    static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getHref(),
                notification.getCreatedAt(),
                notification.isRead());
    }
}

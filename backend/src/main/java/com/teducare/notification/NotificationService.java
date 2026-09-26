package com.teducare.notification;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Real, automatically-generated in-app notifications (API_CONTRACT.md §10)
 * — {@code notifyPlatform}/{@code notifyInstitution}/{@code notifyUser}
 * below are the server-side equivalent of {@code frontend/src/lib/notify.ts},
 * called from {@code InstitutionService}/{@code UserManagerService} at the
 * same points those frontend call sites used to fire from. Only wired into
 * resources that are actually real on the backend — Students/Staff/
 * Academics/etc. remain frontend-only until they get one, so `notify.ts`'s
 * own call sites there are untouched.
 */
@Service
public class NotificationService {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    public void notifyPlatform(String title, String message, String href) {
        save("platform", null, null, title, message, href);
    }

    public void notifyInstitution(String institutionId, String title, String message, String href) {
        save("institution", institutionId, null, title, message, href);
    }

    public void notifyUser(String userId, String title, String message, String href) {
        save("user", null, userId, title, message, href);
    }

    private void save(
            String scopeType, String institutionId, String userId, String title, String message, String href) {
        repository.save(new Notification(
                "notif-" + UUID.randomUUID(),
                title,
                message,
                href,
                Instant.now(),
                false,
                scopeType,
                institutionId,
                userId));
    }

    public Map<String, Object> list(
            String callerId, boolean isSuperAdmin, String institutionId, int page, int perPage) {
        int safePage = Math.max(1, page);
        int safePerPage = Math.max(1, perPage);

        Page<Notification> result = repository.findInScope(
                callerId, isSuperAdmin, institutionId, PageRequest.of(safePage - 1, safePerPage));

        return Map.of(
                "data", result.getContent().stream().map(NotificationResponse::from).toList(),
                "meta", Map.of(
                        "page", safePage,
                        "perPage", safePerPage,
                        "total", result.getTotalElements()));
    }

    public Map<String, Long> unreadCount(String callerId, boolean isSuperAdmin, String institutionId) {
        return Map.of("count", repository.countUnreadInScope(callerId, isSuperAdmin, institutionId));
    }

    public NotificationResponse markRead(
            String id, String callerId, boolean isSuperAdmin, String institutionId) {
        Notification notification = requireInScope(id, callerId, isSuperAdmin, institutionId);
        notification.setRead(true);
        return NotificationResponse.from(repository.save(notification));
    }

    /** @Modifying bulk update queries require a transaction — the only one of those in this codebase so far, everything else goes through JpaRepository's already-transactional save()/delete(). */
    @Transactional
    public void markAllRead(String callerId, boolean isSuperAdmin, String institutionId) {
        repository.markAllReadInScope(callerId, isSuperAdmin, institutionId);
    }

    /** A real delete, not an archive — personal housekeeping (clearing your own feed), not a destructive admin action (API_CONTRACT.md §10.2). */
    public void dismiss(String id, String callerId, boolean isSuperAdmin, String institutionId) {
        Notification notification = requireInScope(id, callerId, isSuperAdmin, institutionId);
        repository.delete(notification);
    }

    /** 404s (not 403) for an out-of-scope id — never confirms another user's/institution's notification even exists. */
    private Notification requireInScope(String id, String callerId, boolean isSuperAdmin, String institutionId) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));

        boolean inScope = switch (notification.getScopeType()) {
            case "platform" -> isSuperAdmin;
            case "institution" -> institutionId != null && institutionId.equals(notification.getScopeInstitutionId());
            case "user" -> callerId.equals(notification.getScopeUserId());
            default -> false;
        };
        if (!inScope) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found.");
        }
        return notification;
    }
}

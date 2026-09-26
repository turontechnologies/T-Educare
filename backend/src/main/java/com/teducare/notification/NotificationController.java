package com.teducare.notification;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

/** Any authenticated user reads/manages their own notification feed — no role restriction, scoping happens per caller (API_CONTRACT.md §10.1). */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthDirectory authDirectory;

    public NotificationController(NotificationService notificationService, AuthDirectory authDirectory) {
        this.notificationService = notificationService;
        this.authDirectory = authDirectory;
    }

    @GetMapping
    public Map<String, Object> list(
            Authentication authentication,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int perPage) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        return notificationService.list(
                caller.id(), "super_admin".equals(caller.role()), caller.institutionId(), page, perPage);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication authentication) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        return notificationService.unreadCount(
                caller.id(), "super_admin".equals(caller.role()), caller.institutionId());
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(Authentication authentication, @PathVariable String id) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        return notificationService.markRead(
                id, caller.id(), "super_admin".equals(caller.role()), caller.institutionId());
    }

    @PostMapping("/read-all")
    public void markAllRead(Authentication authentication) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        notificationService.markAllRead(
                caller.id(), "super_admin".equals(caller.role()), caller.institutionId());
    }

    @DeleteMapping("/{id}")
    public void dismiss(Authentication authentication, @PathVariable String id) {
        AuthenticatedUserDto caller = requireCaller(authentication);
        notificationService.dismiss(
                id, caller.id(), "super_admin".equals(caller.role()), caller.institutionId());
    }

    private AuthenticatedUserDto requireCaller(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        return authDirectory.find(authentication.getName())
                .map(AuthDirectory.Account::user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required."));
    }
}

package com.teducare.profile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;

@Service
public class ProfileService {

    private final AuthDirectory authDirectory;

    public ProfileService(AuthDirectory authDirectory) {
        this.authDirectory = authDirectory;
    }

    public Map<String, Object> getProfile(String username) {
        AuthDirectory.Account account = authDirectory.require(username);
        AuthenticatedUserDto user = account.user();

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.id());
        profile.put("firstName", user.firstName());
        profile.put("lastName", user.lastName());
        profile.put("email", user.email());
        profile.put("role", user.role());
        profile.put("institutionId", user.institutionId());
        profile.put("institutionName", user.institutionName());
        profile.put("roleId", user.roleId());
        profile.put("phone", user.phone() == null ? "" : user.phone());
        profile.put("avatarUrl", user.avatarUrl() == null ? "" : user.avatarUrl());
        profile.put("menuKeys", user.menuKeys() == null ? List.of() : user.menuKeys());

        Map<String, Object> summary = new LinkedHashMap<>();
        if ("super_admin".equalsIgnoreCase(user.role())) {
            summary.put("institutionsCount", 27L);
            summary.put("licensed", 18L);
            summary.put("linkedModules", 14L);
            summary.put("userManagerAccounts", 23L);
        } else {
            summary.put("institutionName", user.institutionName() == null ? "" : user.institutionName());
            summary.put("roleId", user.roleId() == null ? "" : user.roleId());
            summary.put("menuKeysCount", user.menuKeys() == null ? 0 : user.menuKeys().size());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("profile", profile);
        response.put("summary", summary);
        return response;
    }

    public void updatePassword(String username, String currentPassword, String newPassword) {
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is required.");
        }

        if (newPassword == null || newPassword.isBlank() || newPassword.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters.");
        }

        AuthDirectory.Account account = authDirectory.require(username);
        if (!account.password().equals(currentPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }

        authDirectory.updatePassword(username, currentPassword, newPassword);
    }
}

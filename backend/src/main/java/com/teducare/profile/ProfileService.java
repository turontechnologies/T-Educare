package com.teducare.profile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.AuthDirectory;
import com.teducare.auth.AuthenticatedUserDto;
import com.teducare.auth.UserAccountRepository;
import com.teducare.institution.InstitutionRepository;

@Service
public class ProfileService {

    private final AuthDirectory authDirectory;
    private final PasswordEncoder passwordEncoder;
    private final InstitutionRepository institutionRepository;
    private final UserAccountRepository userAccountRepository;

    public ProfileService(
            AuthDirectory authDirectory,
            PasswordEncoder passwordEncoder,
            InstitutionRepository institutionRepository,
            UserAccountRepository userAccountRepository) {
        this.authDirectory = authDirectory;
        this.passwordEncoder = passwordEncoder;
        this.institutionRepository = institutionRepository;
        this.userAccountRepository = userAccountRepository;
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
        profile.put("institutionLogoUrl", user.institutionLogoUrl() == null ? "" : user.institutionLogoUrl());
        profile.put("roleId", user.roleId());
        profile.put("phone", user.phone() == null ? "" : user.phone());
        profile.put("avatarUrl", user.avatarUrl() == null ? "" : user.avatarUrl());
        profile.put("menuKeys", user.menuKeys() == null ? List.of() : user.menuKeys());

        Map<String, Object> summary = new LinkedHashMap<>();
        if ("super_admin".equalsIgnoreCase(user.role())) {
            // Real, platform-wide counts — never hardcoded (API_CONTRACT.md §3.1).
            summary.put("institutionsCount", institutionRepository.countActive());
            summary.put("licensed", institutionRepository.countLicensed());
            summary.put("linkedModules", institutionRepository.countLinkedModules());
            summary.put("userManagerAccounts", userAccountRepository.countActiveUserManagers());
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

    public Map<String, Object> updateProfile(String username, ProfileUpdateRequest request) {
        authDirectory.updateProfile(
                username, request.firstName(), request.lastName(), request.email(), request.phone(),
                request.avatarUrl());
        return getProfile(username);
    }

    public void updatePassword(String username, String currentPassword, String newPassword) {
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is required.");
        }

        if (newPassword == null || newPassword.isBlank() || newPassword.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be at least 8 characters.");
        }

        AuthDirectory.Account account = authDirectory.require(username);
        if (!passwordEncoder.matches(currentPassword, account.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }

        authDirectory.updatePassword(username, currentPassword, newPassword);
    }
}

package com.teducare.usermanager;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.teducare.auth.UserAccount;
import com.teducare.auth.UserAccountRepository;
import com.teducare.institution.Institution;
import com.teducare.institution.InstitutionRepository;
import com.teducare.notification.NotificationService;
import com.teducare.role.Role;
import com.teducare.role.RoleRepository;

@Service
public class UserManagerService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String PASSWORD_ALPHABET =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    private static final String SUPER_ADMIN_HREF = "/super-admin/user-manager";

    private final UserAccountRepository repository;
    private final InstitutionRepository institutionRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public UserManagerService(
            UserAccountRepository repository,
            InstitutionRepository institutionRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService) {
        this.repository = repository;
        this.institutionRepository = institutionRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    /** {@code scopedToInstitutionId}: null for a super_admin caller (sees every institution); a real id when an institution_admin is self-scoping to their own. */
    public Map<String, Object> list(
            int page, int perPage, String search, boolean includeArchived, String scopedToInstitutionId) {
        int safePage = Math.max(1, page);
        int safePerPage = Math.max(1, perPage);
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();

        Page<UserAccount> result = repository.searchUserManagers(
                normalizedSearch, includeArchived, scopedToInstitutionId, PageRequest.of(safePage - 1, safePerPage));

        return Map.of(
                "data", result.getContent().stream().map(UserManagerResponse::from).toList(),
                "meta", Map.of(
                        "page", safePage,
                        "perPage", safePerPage,
                        "total", result.getTotalElements()));
    }

    public UserManagerResponse get(String id) {
        return UserManagerResponse.from(requireUserManager(id));
    }

    public UserManagerResponse create(CreateUserManagerRequest request) {
        if (repository.existsByUsernameIgnoreCase(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That username is already taken.");
        }
        if (repository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "That email is already in use.");
        }

        Institution institution = institutionRepository.findById(request.institutionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Institution not found."));

        String id = "um-" + UUID.randomUUID();
        String code = String.format("%03d", repository.count() + 1);

        UserAccount account = new UserAccount(
                id,
                request.username().trim(),
                passwordEncoder.encode(request.password()),
                request.firstName(),
                request.lastName(),
                request.email(),
                "institution_admin",
                institution.getId(),
                institution.getName(),
                null,
                null,
                request.phone(),
                request.avatarUrl() == null ? "" : request.avatarUrl(),
                code,
                request.otherName() == null ? "" : request.otherName(),
                request.gender(),
                request.isPrimaryAdmin(),
                "active",
                Instant.now(),
                null);

        UserAccount saved = repository.save(account);
        String fullName = saved.getFirstName() + " " + saved.getLastName();
        notificationService.notifyPlatform(
                "New account added",
                fullName + " was added as an admin for " + institution.getName() + ".",
                SUPER_ADMIN_HREF);
        notificationService.notifyInstitution(
                institution.getId(),
                "A new admin was assigned",
                fullName + " was added as an admin for your institution.",
                null);
        return UserManagerResponse.from(saved);
    }

    public UserManagerResponse update(String id, UpdateUserManagerRequest request) {
        UserAccount account = requireUserManager(id);

        if (isPresent(request.firstName())) {
            account.setFirstName(request.firstName());
        }
        if (request.otherName() != null) {
            account.setOtherName(request.otherName());
        }
        if (isPresent(request.lastName())) {
            account.setLastName(request.lastName());
        }
        if (request.gender() != null) {
            account.setGender(request.gender());
        }
        if (isPresent(request.email()) && !request.email().equalsIgnoreCase(account.getEmail())) {
            if (repository.existsByEmailIgnoreCase(request.email())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "That email is already in use.");
            }
            account.setEmail(request.email());
        }
        if (request.phone() != null) {
            account.setPhone(request.phone());
        }
        if (isPresent(request.username()) && !request.username().equalsIgnoreCase(account.getUsername())) {
            if (repository.existsByUsernameIgnoreCase(request.username())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "That username is already taken.");
            }
            account.setUsername(request.username().trim());
        }
        if (isPresent(request.institutionId()) && !request.institutionId().equals(account.getInstitutionId())) {
            Institution institution = institutionRepository.findById(request.institutionId())
                    .orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Institution not found."));
            account.setInstitutionId(institution.getId());
            account.setInstitutionName(institution.getName());
        }
        if (request.isPrimaryAdmin() != null) {
            account.setPrimaryAdmin(request.isPrimaryAdmin());
        }
        if (request.avatarUrl() != null) {
            account.setAvatarUrl(request.avatarUrl());
        }
        if (request.roleId() != null) {
            if (request.roleId().isBlank()) {
                // Explicit blank clears it back to unrestricted (root-admin) access.
                account.setRoleId(null);
            } else {
                Role role = roleRepository.findByIdAndInstitutionId(request.roleId(), account.getInstitutionId())
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST, "Role not found for this account's institution."));
                if (role.getArchivedAt() != null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That role has been archived.");
                }
                account.setRoleId(role.getId());
            }
        }

        UserAccount saved = repository.save(account);
        notificationService.notifyPlatform(
                "Account updated",
                saved.getFirstName() + " " + saved.getLastName() + "'s account was updated.",
                SUPER_ADMIN_HREF);
        notificationService.notifyUser(
                saved.getId(), "Your profile was updated", "An administrator updated your account details.", null);
        return UserManagerResponse.from(saved);
    }

    public UserManagerResponse updateStatus(String id, String status) {
        if (!"active".equals(status) && !"inactive".equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be 'active' or 'inactive'.");
        }

        UserAccount account = requireUserManager(id);
        account.setStatus(status);
        UserAccount saved = repository.save(account);

        String verb = "active".equals(status) ? "activated" : "deactivated";
        notificationService.notifyPlatform(
                "Account " + verb, saved.getUsername() + " was " + verb + ".", SUPER_ADMIN_HREF);
        notificationService.notifyUser(
                saved.getId(),
                "Your account was " + verb,
                "active".equals(status)
                        ? "Your account has regained access."
                        : "Your account has lost access until reactivated.",
                null);
        return UserManagerResponse.from(saved);
    }

    public String resetPassword(String id) {
        UserAccount account = requireUserManager(id);
        String newPassword = generatePassword();
        account.setPasswordHash(passwordEncoder.encode(newPassword));
        UserAccount saved = repository.save(account);

        notificationService.notifyPlatform(
                "Password reset", saved.getUsername() + "'s password was reset.", SUPER_ADMIN_HREF);
        notificationService.notifyUser(
                saved.getId(),
                "Your password was reset",
                "An administrator reset your password. Use the new password they shared with you to log in.",
                null);
        return newPassword;
    }

    public UserManagerResponse archive(String id) {
        UserAccount account = requireUserManager(id);
        account.setArchivedAt(Instant.now());
        UserAccount saved = repository.save(account);

        notificationService.notifyPlatform(
                "Account deleted", saved.getUsername() + " was archived.", SUPER_ADMIN_HREF);
        return UserManagerResponse.from(saved);
    }

    public UserManagerResponse restore(String id) {
        UserAccount account = requireUserManager(id);
        account.setArchivedAt(null);
        UserAccount saved = repository.save(account);

        notificationService.notifyPlatform(
                "Account restored", saved.getUsername() + " was restored from the archive.", SUPER_ADMIN_HREF);
        return UserManagerResponse.from(saved);
    }

    /** Only ever resolves an institution_admin row — a super_admin id here is treated as not found, not leaked. */
    private UserAccount requireUserManager(String id) {
        UserAccount account = repository.findById(id)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User manager account not found."));
        if (!"institution_admin".equals(account.getRole())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User manager account not found.");
        }
        return account;
    }

    private static boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private static String generatePassword() {
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            password.append(PASSWORD_ALPHABET.charAt(RANDOM.nextInt(PASSWORD_ALPHABET.length())));
        }
        return password.toString();
    }
}

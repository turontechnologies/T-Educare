package com.teducare.auth;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AuthDirectory {

        public record Account(String username, String password, AuthenticatedUserDto user) {
        }

        private final PasswordEncoder passwordEncoder;
        private final Map<String, Account> accounts;

        public AuthDirectory(PasswordEncoder passwordEncoder) {
                this.passwordEncoder = passwordEncoder;
                this.accounts = new ConcurrentHashMap<>(Stream.of(
                                new Account(
                                                "super_admin",
                                                passwordEncoder.encode("Super@2024"),
                                                new AuthenticatedUserDto(
                                                                "demo-super-admin",
                                                                "Ada",
                                                                "Okoye",
                                                                "ada.okoye@turontech.com",
                                                                "super_admin",
                                                                null,
                                                                null,
                                                                null,
                                                                null,
                                                                "08012345678",
                                                                "")),
                                new Account(
                                                "turon_admin",
                                                passwordEncoder.encode("Turon@2024"),
                                                new AuthenticatedUserDto(
                                                                "um-christian-smart",
                                                                "Christian",
                                                                "Smart",
                                                                "christian.smart@turontech.com",
                                                                "institution_admin",
                                                                "inst-xyz-college",
                                                                "XYZ College of Technology",
                                                                "role-institution-admin",
                                                                null,
                                                                "08022223333",
                                                                "")),
                                new Account(
                                                "amara_bello",
                                                passwordEncoder.encode("Amara@2024"),
                                                new AuthenticatedUserDto(
                                                                "um-amara-bello",
                                                                "Amara",
                                                                "Bello",
                                                                "amara.bello@turontech.com",
                                                                "institution_admin",
                                                                "inst-ahmadubellouniversit-1",
                                                                "Ahmadu Bello University",
                                                                "role-front-desk",
                                                                List.of("dashboard", "registration", "students"),
                                                                "08033334444",
                                                                "")))
                                .collect(Collectors.toMap(
                                                account -> account.username().toLowerCase(),
                                                Function.identity())));
        }

        public Optional<Account> find(String username) {
                if (username == null || username.isBlank()) {
                        return Optional.empty();
                }
                return Optional.ofNullable(accounts.get(username.trim().toLowerCase()));
        }

        public Account require(String username) {
                return find(username)
                                .orElseThrow(() -> new BadCredentialsException("Invalid username or password."));
        }

        public void updatePassword(String username, String currentPassword, String newPassword) {
                Account account = require(username);
                if (!passwordEncoder.matches(currentPassword, account.password())) {
                        throw new BadCredentialsException("Current password is incorrect.");
                }

                accounts.put(username.trim().toLowerCase(), new Account(
                                account.username(),
                                passwordEncoder.encode(newPassword),
                                account.user()));
        }

        public AuthenticatedUserDto updateProfile(
                        String username, String firstName, String lastName, String email, String phone, String avatarUrl) {
                Account account = require(username);
                AuthenticatedUserDto current = account.user();

                AuthenticatedUserDto updated = new AuthenticatedUserDto(
                                current.id(),
                                orDefault(firstName, current.firstName()),
                                orDefault(lastName, current.lastName()),
                                orDefault(email, current.email()),
                                current.role(),
                                current.institutionId(),
                                current.institutionName(),
                                current.roleId(),
                                current.menuKeys(),
                                phone != null ? phone : current.phone(),
                                avatarUrl != null ? avatarUrl : current.avatarUrl());

                accounts.put(username.trim().toLowerCase(), new Account(account.username(), account.password(), updated));
                return updated;
        }

        private static String orDefault(String value, String fallback) {
                return value == null || value.isBlank() ? fallback : value;
        }
}

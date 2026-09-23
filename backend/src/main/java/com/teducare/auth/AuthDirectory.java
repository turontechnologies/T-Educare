package com.teducare.auth;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;

@Component
public class AuthDirectory {

    public record Account(String username, String password, AuthenticatedUserDto user) {
    }

    private final Map<String, Account> accounts;

    public AuthDirectory() {
        this.accounts = Stream.of(
                new Account(
                        "super_admin",
                        "Super@2024",
                        new AuthenticatedUserDto(
                                "demo-super-admin",
                                "Ada",
                                "Okoye",
                                "ada.okoye@turontech.com",
                                "super_admin",
                                null,
                                null,
                                null,
                                null)),
                new Account(
                        "turon_admin",
                        "Turon@2024",
                        new AuthenticatedUserDto(
                                "um-christian-smart",
                                "Christian",
                                "Smart",
                                "christian.smart@turontech.com",
                                "institution_admin",
                                "inst-xyz-college",
                                "XYZ College of Technology",
                                "role-institution-admin",
                                null)),
                new Account(
                        "amara_bello",
                        "Amara@2024",
                        new AuthenticatedUserDto(
                                "um-amara-bello",
                                "Amara",
                                "Bello",
                                "amara.bello@turontech.com",
                                "institution_admin",
                                "inst-ahmadubellouniversit-1",
                                "Ahmadu Bello University",
                                "role-front-desk",
                                List.of("dashboard", "registration", "students"))))
                .collect(Collectors.toUnmodifiableMap(
                        account -> account.username().toLowerCase(),
                        Function.identity()));
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
}

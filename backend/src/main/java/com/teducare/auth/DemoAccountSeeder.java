package com.teducare.auth;

import java.time.Instant;
import java.util.List;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Seeds the 3 demo accounts into the database once, if the table is empty. */
@Component
public class DemoAccountSeeder {

    private final UserAccountRepository repository;
    private final PasswordEncoder passwordEncoder;

    public DemoAccountSeeder(UserAccountRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedDemoAccounts() {
        if (repository.count() > 0) {
            return;
        }

        repository.saveAll(List.of(
                new UserAccount(
                        "demo-super-admin",
                        "super_admin",
                        passwordEncoder.encode("Super@2024"),
                        "Adetunji",
                        "Aderinwale",
                        "ade.adetunji@turontech.com",
                        "super_admin",
                        null,
                        null,
                        null,
                        null,
                        "08012345678",
                        "",
                        null,
                        null,
                        null,
                        false,
                        "active",
                        Instant.parse("2026-01-01T00:00:00Z"),
                        null),
                new UserAccount(
                        "um-christian-smart",
                        "turon_admin",
                        passwordEncoder.encode("Turon@2024"),
                        "Christian",
                        "Smart",
                        "christian.smart@turontech.com",
                        "institution_admin",
                        "inst-xyz-college",
                        "XYZ College of Technology",
                        "role-institution-admin",
                        null,
                        "08022223333",
                        "",
                        "001",
                        "",
                        "Male",
                        true,
                        "active",
                        Instant.parse("2026-01-01T00:00:00Z"),
                        null),
                new UserAccount(
                        "um-amara-bello",
                        "amara_bello",
                        passwordEncoder.encode("Amara@2024"),
                        "Amara",
                        "Bello",
                        "amara.bello@turontech.com",
                        "institution_admin",
                        "inst-ahmadubellouniversit-1",
                        "Ahmadu Bello University",
                        "role-front-desk",
                        "dashboard,registration,students",
                        "08033334444",
                        "",
                        "002",
                        "",
                        "Female",
                        false,
                        "active",
                        Instant.parse("2026-01-06T00:00:00Z"),
                        null)));
    }
}

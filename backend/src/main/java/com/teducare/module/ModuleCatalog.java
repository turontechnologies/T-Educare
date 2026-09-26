package com.teducare.module;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Small, fixed, server-owned catalog of platform features a super admin can
 * activate per institution (API_CONTRACT.md §4.6.1). Must match
 * {@code frontend/src/config/modules.ts} key-for-key — {@code Institution
 * .moduleKeys} stores these keys directly, so renaming one here without
 * updating the frontend (or vice versa) would silently orphan every
 * institution already linked against the old key.
 */
public final class ModuleCatalog {

    public static final List<PlatformModule> ALL = List.of(
            new PlatformModule("payment", "Payment module"),
            new PlatformModule("students", "Students"),
            new PlatformModule("lecturer", "Lecturer"),
            new PlatformModule("exams", "Exams"),
            new PlatformModule("results", "Results"),
            new PlatformModule("reports", "Reports"),
            new PlatformModule("sms-integration", "SMS Integration"),
            new PlatformModule("ussd-services", "USSD Services"),
            new PlatformModule("hotels", "Hotels"),
            new PlatformModule("accommodations", "Accommodations"),
            new PlatformModule("registration", "Registration"),
            new PlatformModule("faculty", "Faculty"),
            new PlatformModule("department", "Department"),
            new PlatformModule("school", "School"),
            new PlatformModule("courses", "Courses"),
            new PlatformModule("transport", "Transport"),
            new PlatformModule("referral-application", "Referral Application"),
            new PlatformModule("resit-module", "Resit Module"),
            new PlatformModule("admission", "Admission"));

    public static final Set<String> KEYS =
            ALL.stream().map(PlatformModule::key).collect(Collectors.toUnmodifiableSet());

    private ModuleCatalog() {
    }
}

package com.teducare.module;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Small, fixed, server-owned catalog of platform features a super admin can
 * activate per institution (API_CONTRACT.md §4.6.1).
 *
 * <p><b>Every key here corresponds to exactly one real nav item in the
 * institution_admin dashboard, and every real nav item has exactly one key
 * here</b> — {@code frontend/src/config/nav.ts}'s {@code INSTITUTION_NAV}.
 * Explicitly requested (2026-09-26): the assignable list on the
 * super-admin Modules page must match what the institution admin's own
 * frontend actually has, one-to-one, not an aspirational broader catalog
 * (an earlier 19-entry version included 8 keys with no nav counterpart at
 * all) and not a partial one either (an intermediate 11-entry version only
 * covered items that already happened to be module-gated, leaving Session
 * Management, Program Management, Program Levels, Courses Grades,
 * Designation, All Staff, User Management, Announcement, Notifications,
 * Requests, and Support ungated and therefore un-assignable). The only
 * item deliberately excluded is {@code dashboard} itself — always
 * available once the institution is reachable at all, since a logged-in
 * user needs somewhere to land regardless of what's been assigned. Labels
 * are copied verbatim from each nav item's own label. Order matches
 * {@code INSTITUTION_NAV}'s own top-to-bottom order (`GET /modules`'s
 * whole reason for existing over a client-side constant is precisely so
 * this stays server-owned and can grow without a redeploy — but adding a
 * key here without a matching {@code moduleKey} in {@code nav.ts}, or vice
 * versa, reintroduces the exact mismatch this was built to fix).
 */
public final class ModuleCatalog {

    public static final List<PlatformModule> ALL = List.of(
            new PlatformModule("registration", "Registration"),
            new PlatformModule("academic-sessions", "Session Management"),
            new PlatformModule("school", "School Management"),
            new PlatformModule("faculty", "Faculty Management"),
            new PlatformModule("department", "Department Management"),
            new PlatformModule("programs", "Program Management"),
            new PlatformModule("program-levels", "Program Levels"),
            new PlatformModule("course-grades", "Courses Grades"),
            new PlatformModule("courses", "Courses Management"),
            new PlatformModule("students", "Student Management"),
            new PlatformModule("staff-designation", "Designation"),
            new PlatformModule("staff-all", "All Staff"),
            new PlatformModule("user-management", "User Management"),
            new PlatformModule("lecturer", "Lecture Management"),
            new PlatformModule("payment", "Financials"),
            new PlatformModule("results", "Results Management"),
            new PlatformModule("hotels", "Hostel Management"),
            new PlatformModule("transport", "Transport Management"),
            new PlatformModule("announcements", "Announcement"),
            new PlatformModule("notifications", "Notifications"),
            new PlatformModule("requests", "Requests"),
            new PlatformModule("support", "Support"));

    public static final Set<String> KEYS =
            ALL.stream().map(PlatformModule::key).collect(Collectors.toUnmodifiableSet());

    private ModuleCatalog() {
    }
}

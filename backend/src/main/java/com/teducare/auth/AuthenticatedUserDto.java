package com.teducare.auth;

import java.util.List;

public record AuthenticatedUserDto(
                String id,
                String firstName,
                String lastName,
                String email,
                String role,
                String institutionId,
                String institutionName,
                String roleId,
                List<String> menuKeys,
                String phone,
                String avatarUrl,
                String institutionLogoUrl,
                /** institution_admin only — this institution's own scoped login URL slug (see Institution#getSlug). Drives the admin app's own "Portal Links"/slug-aware logout redirect; resolved live, same as institutionName/institutionLogoUrl. */
                String institutionSlug,
                /** institution_admin only — hex color (e.g. "#1B5E20") applied as the dashboard's own `--primary` CSS override once logged in, so the whole authenticated app reflects it, not just the institution-scoped login screen. Null uses the platform's default navy. */
                String institutionBrandColor,
                /** Links this account to a real Lecturer record (see com.teducare.lecturer) — null for every account except a lecturer's own login. */
                String lecturerId,
                /** Links this account to a real StaffMember record (see com.teducare.staff) — null for every account except a staff member's own login. Drives Time & Attendance's self-service "My Attendance" view. */
                String staffId) {
}

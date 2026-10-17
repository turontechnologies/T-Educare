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
                /** Links this account to a real Lecturer record (see com.teducare.lecturer) — null for every account except a lecturer's own login. */
                String lecturerId,
                /** Links this account to a real StaffMember record (see com.teducare.staff) — null for every account except a staff member's own login. Drives Time & Attendance's self-service "My Attendance" view. */
                String staffId) {
}

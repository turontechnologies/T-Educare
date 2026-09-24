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
                String institutionLogoUrl) {
}

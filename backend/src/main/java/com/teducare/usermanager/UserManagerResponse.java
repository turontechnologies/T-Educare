package com.teducare.usermanager;

import java.time.Instant;

import com.teducare.auth.UserAccount;

public record UserManagerResponse(
        String id,
        String code,
        String firstName,
        String otherName,
        String lastName,
        String gender,
        String email,
        String phone,
        String username,
        String institutionId,
        String institutionName,
        boolean isPrimaryAdmin,
        String avatarUrl,
        String status,
        Instant createdAt,
        Instant archivedAt) {

    static UserManagerResponse from(UserAccount account) {
        return new UserManagerResponse(
                account.getId(),
                account.getCode(),
                account.getFirstName(),
                account.getOtherName(),
                account.getLastName(),
                account.getGender(),
                account.getEmail(),
                account.getPhone(),
                account.getUsername(),
                account.getInstitutionId(),
                account.getInstitutionName(),
                account.isPrimaryAdmin(),
                account.getAvatarUrl(),
                account.getStatus(),
                account.getCreatedAt(),
                account.getArchivedAt());
    }
}

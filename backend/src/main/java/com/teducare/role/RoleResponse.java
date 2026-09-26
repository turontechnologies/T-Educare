package com.teducare.role;

import java.time.Instant;
import java.util.List;

public record RoleResponse(
        String id,
        String institutionId,
        String name,
        String description,
        List<String> menuKeys,
        Instant createdAt,
        Instant archivedAt) {

    static RoleResponse from(Role role) {
        String keys = role.getMenuKeys();
        return new RoleResponse(
                role.getId(),
                role.getInstitutionId(),
                role.getName(),
                role.getDescription(),
                keys == null || keys.isBlank() ? List.of() : List.of(keys.split(",")),
                role.getCreatedAt(),
                role.getArchivedAt());
    }
}

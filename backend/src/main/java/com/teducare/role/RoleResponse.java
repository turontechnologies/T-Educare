package com.teducare.role;

import java.time.Instant;
import java.util.List;

public record RoleResponse(
        String id,
        String institutionId,
        String name,
        String description,
        List<String> menuKeys,
        List<String> editableMenuKeys,
        Instant createdAt,
        Instant archivedAt) {

    static RoleResponse from(Role role) {
        return new RoleResponse(
                role.getId(),
                role.getInstitutionId(),
                role.getName(),
                role.getDescription(),
                split(role.getMenuKeys()),
                split(role.getEditableMenuKeys()),
                role.getCreatedAt(),
                role.getArchivedAt());
    }

    private static List<String> split(String keys) {
        return keys == null || keys.isBlank() ? List.of() : List.of(keys.split(","));
    }
}

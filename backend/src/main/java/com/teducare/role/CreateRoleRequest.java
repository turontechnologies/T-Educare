package com.teducare.role;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record CreateRoleRequest(
        @NotBlank(message = "Name is required.") String name,
        String description,
        @NotEmpty(message = "Select at least one menu item.") List<String> menuKeys,
        /** Subset of {@code menuKeys} this role may also edit — null/omitted means view-only everywhere. */
        List<String> editableMenuKeys) {
}

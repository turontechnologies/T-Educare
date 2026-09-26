package com.teducare.role;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record CreateRoleRequest(
        @NotBlank(message = "Name is required.") String name,
        String description,
        @NotEmpty(message = "Select at least one menu item.") List<String> menuKeys) {
}

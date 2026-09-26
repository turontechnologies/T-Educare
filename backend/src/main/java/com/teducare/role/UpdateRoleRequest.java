package com.teducare.role;

import java.util.List;

/** Any field left null keeps its current value — same partial-update convention as institution/UpdateInstitutionRequest. */
public record UpdateRoleRequest(String name, String description, List<String> menuKeys) {
}

package com.teducare.school;

/** Any field left null keeps its current value — same partial-update convention as role/UpdateRoleRequest. */
public record UpdateSchoolRequest(String name, String headName, String designation) {
}

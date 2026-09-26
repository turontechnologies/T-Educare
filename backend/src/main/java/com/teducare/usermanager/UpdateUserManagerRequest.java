package com.teducare.usermanager;

import jakarta.validation.constraints.Email;

/** Any field left null keeps its current value — same partial-update convention as institution/UpdateInstitutionRequest. */
public record UpdateUserManagerRequest(
        String firstName,
        String otherName,
        String lastName,
        String gender,
        @Email(message = "Enter a valid email address.") String email,
        String phone,
        String username,
        String institutionId,
        Boolean isPrimaryAdmin,
        String avatarUrl,
        /** Left out entirely keeps the current value (same convention as phone/avatarUrl); an explicit blank string clears it back to unrestricted. */
        String roleId) {
}

package com.teducare.usermanager;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class UserManagerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void institutionAdminSelfServiceIsScopedToTheirOwnInstitutionOnly() throws Exception {
        // turon_admin (XYZ College) manages his own institution's staff — this
        // is the real "Users" tab of /dashboard/user-management
        // (API_CONTRACT.md §6), not a separate mocked resource.
        String xyzToken = loginAs("turon_admin", "Turon@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String username = "self_service_" + suffix;

        String listBefore = mockMvc.perform(get("/api/user-managers")
                .header("Authorization", "Bearer " + xyzToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        // Never another institution's staff, even though real ones exist (amara_bello).
        org.junit.jupiter.api.Assertions.assertFalse(listBefore.contains("amara_bello"));

        // Creating staff is forced to his own institution, and can never mint
        // another unrestricted primary admin regardless of what's requested.
        String createResponse = mockMvc.perform(post("/api/user-managers")
                .header("Authorization", "Bearer " + xyzToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"firstName":"Self","lastName":"Service","email":"self.service.%s@example.com",
                         "username":"%s","password":"SelfServe@2026",
                         "institutionId":"inst-ahmadubellouniversit-1","isPrimaryAdmin":true}
                        """.formatted(suffix, username)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.institutionId").value("inst-xyz-college"))
                .andExpect(jsonPath("$.isPrimaryAdmin").value(false))
                .andReturn()
                .getResponse()
                .getContentAsString();
        String id = createResponse.split("\"id\":\"")[1].split("\"")[0];

        try {
            // He can edit his own new staff member's plain fields...
            mockMvc.perform(patch("/api/user-managers/" + id)
                    .header("Authorization", "Bearer " + xyzToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"08011110000\"}"))
                    .andExpect(status().isOk());

            // ...but never reassign their institution or grant primary-admin.
            mockMvc.perform(patch("/api/user-managers/" + id)
                    .header("Authorization", "Bearer " + xyzToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"isPrimaryAdmin\":true}"))
                    .andExpect(status().isForbidden());
            mockMvc.perform(patch("/api/user-managers/" + id)
                    .header("Authorization", "Bearer " + xyzToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"institutionId\":\"inst-ahmadubellouniversit-1\"}"))
                    .andExpect(status().isForbidden());

            // A completely different institution's admin can't touch this
            // account at all — refused, not merely hidden.
            String amaraToken = loginAs("amara_bello", "Amara@2024");
            mockMvc.perform(patch("/api/user-managers/" + id)
                    .header("Authorization", "Bearer " + amaraToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"09000000000\"}"))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post("/api/user-managers/" + id + "/archive")
                    .header("Authorization", "Bearer " + amaraToken))
                    .andExpect(status().isForbidden());
        } finally {
            mockMvc.perform(post("/api/user-managers/" + id + "/archive")
                    .header("Authorization", "Bearer " + xyzToken));
        }
    }

    @Test
    void listReturnsSeededUserManagersForSuperAdmin() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        mockMvc.perform(get("/api/user-managers")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.meta.total").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }

    @Test
    void createRejectsDuplicateUsernameAndUnknownInstitution() throws Exception {
        String token = loginAs("super_admin", "Super@2024");

        mockMvc.perform(post("/api/user-managers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"firstName":"Test","lastName":"User","email":"dup1@example.com",
                         "username":"turon_admin","password":"Passw0rd!23",
                         "institutionId":"inst-xyz-college","isPrimaryAdmin":false}
                        """))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/user-managers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"firstName":"Test","lastName":"User","email":"dup2@example.com",
                         "username":"brand-new-user-1","password":"Passw0rd!23",
                         "institutionId":"inst-does-not-exist","isPrimaryAdmin":false}
                        """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void fullLifecycleCreateEditResetStatusArchiveRestoreAndLoginIntegration() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");

        // Unique per run — archiving (below) doesn't free up the username/email for
        // reuse (no hard-delete exists, matching Institutions' own convention), so a
        // fixed value here would 409 on every run after the first against this same
        // persistent DB.
        String suffix = String.valueOf(System.currentTimeMillis());
        String username = "grace_eze_" + suffix;
        String email = "grace.eze." + suffix + "@example.com";

        // Create — a real, freshly-created User Manager account.
        String createResponse = mockMvc.perform(post("/api/user-managers")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"firstName":"Grace","lastName":"Eze","gender":"Female",
                         "email":"%s","phone":"08099990000",
                         "username":"%s","password":"GraceP@ss1",
                         "institutionId":"inst-xyz-college","isPrimaryAdmin":false}
                        """.formatted(email, username)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("active"))
                .andExpect(jsonPath("$.institutionName").value("XYZ College of Technology"))
                .andExpect(jsonPath("$.code").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String id = createResponse.split("\"id\":\"")[1].split("\"")[0];

        try {
            // The new account can log in immediately — it IS the login identity, not a
            // separate record (API_CONTRACT.md §3's explicit design).
            loginAs(username, "GraceP@ss1");

            // Edit — core fields.
            mockMvc.perform(patch("/api/user-managers/" + id)
                    .header("Authorization", "Bearer " + superToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"phone\":\"08011112222\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.phone").value("08011112222"));

            // Reset password — new password works, old one doesn't.
            String resetResponse = mockMvc.perform(post("/api/user-managers/" + id + "/reset-password")
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();
            String newPassword = resetResponse.split("\"password\":\"")[1].split("\"")[0];

            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"" + username + "\",\"password\":\"GraceP@ss1\"}"))
                    .andExpect(status().isUnauthorized());
            loginAs(username, newPassword);

            // Deactivate — login now rejected even with the correct (current) password.
            mockMvc.perform(patch("/api/user-managers/" + id + "/status")
                    .header("Authorization", "Bearer " + superToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"inactive\"}"))
                    .andExpect(status().isOk());
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"" + username + "\",\"password\":\"" + newPassword + "\"}"))
                    .andExpect(status().isUnauthorized());

            // Reactivate — works again.
            mockMvc.perform(patch("/api/user-managers/" + id + "/status")
                    .header("Authorization", "Bearer " + superToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"active\"}"))
                    .andExpect(status().isOk());
            loginAs(username, newPassword);

            // Archive — also rejected at login, same as deactivation.
            mockMvc.perform(post("/api/user-managers/" + id + "/archive")
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"" + username + "\",\"password\":\"" + newPassword + "\"}"))
                    .andExpect(status().isUnauthorized());

            // Restore — works again.
            mockMvc.perform(post("/api/user-managers/" + id + "/restore")
                    .header("Authorization", "Bearer " + superToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").doesNotExist());
            loginAs(username, newPassword);
        } finally {
            // No hard-delete exists (matches Institutions' own convention) — archive so
            // repeated runs against this persistent DB don't pile up active test accounts.
            mockMvc.perform(post("/api/user-managers/" + id + "/archive")
                    .header("Authorization", "Bearer " + superToken));
        }
    }

    private String loginAs(String username, String password) throws Exception {
        String body = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";

        String response = mockMvc
                .perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return response.split("\"token\":\"")[1].split("\"")[0];
    }
}

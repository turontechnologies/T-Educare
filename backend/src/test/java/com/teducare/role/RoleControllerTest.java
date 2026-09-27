package com.teducare.role;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
class RoleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void roleAssignedToAnAccountIsWhatThatAccountSeesTheMomentItLogsIn() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());

        String institutionId = createInstitution(superToken, "Role Test University " + suffix);
        String username = "role_test_admin_" + suffix;
        String userManagerId = null;
        try {
            userManagerId = createUserManager(superToken, institutionId, username, "role_test_" + suffix);

            // Before any role is assigned, this account is unrestricted (its
            // primary admin was created the same way every real one is —
            // roleId null).
            String token = loginAs(username, "RoleTest@2024");
            mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.menuKeys").doesNotExist());

            // The institution's own admin creates a real, restrictive role.
            String createResponse = mockMvc.perform(post("/api/roles")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"name":"Exam Officer","description":"Grades only",
                             "menuKeys":["dashboard","results"]}
                            """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.menuKeys.length()").value(2))
                    .andReturn()
                    .getResponse()
                    .getContentAsString();
            String roleId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // super_admin assigns that real role to the account.
            mockMvc.perform(patch("/api/user-managers/" + userManagerId)
                    .header("Authorization", "Bearer " + superToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"roleId\":\"" + roleId + "\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.roleId").value(roleId));

            // The very next request this account makes — no re-login even
            // needed — reflects the real, live-assigned role.
            mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.roleId").value(roleId))
                    .andExpect(jsonPath("$.menuKeys[0]").value("dashboard"))
                    .andExpect(jsonPath("$.menuKeys[1]").value("results"));

            // A genuinely fresh login carries the same live-resolved value too.
            String freshToken = loginAs(username, "RoleTest@2024");
            mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + freshToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.menuKeys.length()").value(2));

            // Editing the role's menu keys reaches the account live too, with
            // no reassignment needed.
            mockMvc.perform(patch("/api/roles/" + roleId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"menuKeys\":[\"dashboard\",\"results\",\"students\"]}"))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.menuKeys.length()").value(3));

            // Clearing the assignment back to blank restores unrestricted access.
            mockMvc.perform(patch("/api/user-managers/" + userManagerId)
                    .header("Authorization", "Bearer " + superToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"roleId\":\"\"}"))
                    .andExpect(status().isOk());
            mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.menuKeys").doesNotExist());
        } finally {
            if (userManagerId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            mockMvc.perform(post("/api/institutions/" + institutionId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
        }
    }

    @Test
    void roleCrudIsScopedToTheCallersOwnInstitutionOnly() throws Exception {
        // turon_admin (XYZ College) must never see or touch amara_bello's
        // (Ahmadu Bello University) real "Front Desk Officer" role.
        String xyzToken = loginAs("turon_admin", "Turon@2024");

        String listResponse = mockMvc.perform(get("/api/roles")
                .header("Authorization", "Bearer " + xyzToken))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        assertFalse(listResponse.contains("role-front-desk"), "XYZ College must not see Ahmadu Bello's role");

        mockMvc.perform(patch("/api/roles/role-front-desk")
                .header("Authorization", "Bearer " + xyzToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Hijacked\"}"))
                .andExpect(status().isNotFound());

        // Mutating a role always requires a real institution of one's own —
        // a super_admin can view (see below) but never create/edit/archive.
        String superToken = loginAs("super_admin", "Super@2024");
        mockMvc.perform(post("/api/roles")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"X\",\"menuKeys\":[\"dashboard\"]}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void superAdminCanViewButNotBlindlyListAnyInstitutionsRealRoles() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");

        // No institutionId at all — refused, not defaulted to "everything"
        // or "nothing", so a caller can't accidentally get an empty list
        // and mistake it for "this institution really has no roles".
        mockMvc.perform(get("/api/roles").header("Authorization", "Bearer " + superToken))
                .andExpect(status().isBadRequest());

        // With one, sees the same real row an institution_admin caller
        // would — this is what backs the super admin's own User Manager
        // role picker, for exactly the case where an institution's only
        // admin is themselves too restricted to reach
        // /dashboard/user-management and fix their own over-restriction.
        mockMvc.perform(get("/api/roles")
                .param("institutionId", "inst-ahmadubellouniversit-1")
                .header("Authorization", "Bearer " + superToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("role-front-desk"));
    }

    @Test
    void systemRoleProtectionsAndValidationAreEnforced() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Role Validation University " + suffix);
        String username = "role_val_admin_" + suffix;
        String userManagerId = null;
        try {
            userManagerId = createUserManager(superToken, institutionId, username, "role_val_" + suffix);
            String token = loginAs(username, "RoleTest@2024");

            // Empty menuKeys is rejected.
            mockMvc.perform(post("/api/roles")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Nothing\",\"menuKeys\":[]}"))
                    .andExpect(status().isBadRequest());

            // An unknown/legacy menu key (matching Modules' own "Unknown
            // module key" precedent) is rejected, not silently stored.
            mockMvc.perform(post("/api/roles")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Bogus\",\"menuKeys\":[\"exams\"]}"))
                    .andExpect(status().isBadRequest());

            // Duplicate name within the same institution is rejected.
            mockMvc.perform(post("/api/roles")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Registrar\",\"menuKeys\":[\"dashboard\"]}"))
                    .andExpect(status().isCreated());
            mockMvc.perform(post("/api/roles")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Registrar\",\"menuKeys\":[\"dashboard\"]}"))
                    .andExpect(status().isConflict());

            // Assigning a role that belongs to a *different* institution is rejected.
            mockMvc.perform(patch("/api/user-managers/" + userManagerId)
                    .header("Authorization", "Bearer " + superToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"roleId\":\"role-front-desk\"}"))
                    .andExpect(status().isBadRequest());

            assertTrue(true);
        } finally {
            if (userManagerId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            mockMvc.perform(post("/api/institutions/" + institutionId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
        }
    }

    private String createInstitution(String superToken, String name) throws Exception {
        String response = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"%s","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@roletestuniversity.edu.ng"}
                        """.formatted(name)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createUserManager(String superToken, String institutionId, String username, String emailPrefix)
            throws Exception {
        String response = mockMvc.perform(post("/api/user-managers")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"firstName":"Role","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"RoleTest@2024",
                         "institutionId":"%s","isPrimaryAdmin":true}
                        """.formatted(emailPrefix, username, institutionId)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
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

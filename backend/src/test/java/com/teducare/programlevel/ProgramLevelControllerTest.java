package com.teducare.programlevel;

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
class ProgramLevelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullProgramLevelLifecycleIncludingDuplicateRejectionAndArchiveRestore() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "Program Level Test University " + suffix);
        String username = "level_admin_" + suffix;
        String userManagerId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "level_" + suffix);
            String token = loginAs(username, "LevelTest@2026");

            String createResponse = mockMvc.perform(post("/api/program-levels")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"levelCode":"100","description":"100 levels"}
                            """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.levelCode").value("100"))
                    .andExpect(jsonPath("$.archivedAt").doesNotExist())
                    .andReturn().getResponse().getContentAsString();
            String levelId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate level code (case-insensitive — codes are plain strings) rejected.
            mockMvc.perform(post("/api/program-levels")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"levelCode":"100","description":"Different description"}
                            """))
                    .andExpect(status().isConflict());

            // Missing required fields rejected.
            mockMvc.perform(post("/api/program-levels")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"levelCode":"","description":""}
                            """))
                    .andExpect(status().isBadRequest());

            // Edit.
            mockMvc.perform(patch("/api/program-levels/" + levelId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"description\":\"Year one\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.description").value("Year one"))
                    .andExpect(jsonPath("$.levelCode").value("100"));

            // Archive + restore round trip.
            mockMvc.perform(post("/api/program-levels/" + levelId + "/archive")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/program-levels")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(levelId));
            String listWithArchived = mockMvc.perform(get("/api/program-levels?includeArchived=true")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(listWithArchived.contains(levelId));
            mockMvc.perform(post("/api/program-levels/" + levelId + "/restore")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").doesNotExist());
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
    void programLevelsAreScopedToTheCallersOwnInstitutionOnly() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Program Level Isolation A " + suffix);
        String institutionBId = createInstitution(superToken, "Program Level Isolation B " + suffix);
        String usernameA = "level_iso_a_" + suffix;
        String usernameB = "level_iso_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "level_iso_a_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "level_iso_b_" + suffix);
            String tokenA = loginAs(usernameA, "LevelTest@2026");
            String tokenB = loginAs(usernameB, "LevelTest@2026");

            String levelResponse = mockMvc.perform(post("/api/program-levels")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"levelCode":"300","description":"300 levels"}
                            """))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String levelId = levelResponse.split("\"id\":\"")[1].split("\"")[0];

            String listForB = mockMvc.perform(get("/api/program-levels")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(levelId), "Institution B must not see Institution A's program level");

            mockMvc.perform(patch("/api/program-levels/" + levelId)
                    .header("Authorization", "Bearer " + tokenB)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"levelCode\":\"Hijacked\"}"))
                    .andExpect(status().isNotFound());

            String superAdminToken = loginAs("super_admin", "Super@2024");
            mockMvc.perform(get("/api/program-levels")
                    .header("Authorization", "Bearer " + superAdminToken))
                    .andExpect(status().isForbidden());
        } finally {
            if (userManagerAId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerAId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            if (userManagerBId != null) {
                mockMvc.perform(post("/api/user-managers/" + userManagerBId + "/archive")
                        .header("Authorization", "Bearer " + superToken));
            }
            mockMvc.perform(post("/api/institutions/" + institutionAId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
            mockMvc.perform(post("/api/institutions/" + institutionBId + "/archive")
                    .header("Authorization", "Bearer " + superToken));
        }
    }

    private String createInstitution(String superToken, String name) throws Exception {
        String response = mockMvc.perform(post("/api/institutions")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"%s","institutionType":"University",
                         "adminUser":"Test Admin","adminEmail":"admin@programleveltestuniversity.edu.ng"}
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
                        {"firstName":"Level","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"LevelTest@2026",
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

package com.teducare.staffdesignation;

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
class StaffDesignationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullLifecycleWithDuplicateRejectionAndCrossInstitutionIsolation() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "StaffDesig Test University " + suffix);
        String institutionBId = createInstitution(superToken, "StaffDesig Test University B " + suffix);
        String usernameA = "staffdesig_admin_" + suffix;
        String usernameB = "staffdesig_admin_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "staffdesig_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "staffdesig_b_" + suffix);
            String tokenA = loginAs(usernameA, "StaffDesigTest@2026");
            String tokenB = loginAs(usernameB, "StaffDesigTest@2026");

            // Invalid category rejected.
            mockMvc.perform(post("/api/staff-designations")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Lecturer\",\"description\":\"Teaches courses\",\"category\":\"Bogus\"}"))
                    .andExpect(status().isBadRequest());

            // Create.
            String createResponse = mockMvc.perform(post("/api/staff-designations")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Lecturer\",\"description\":\"Teaches courses\","
                            + "\"category\":\"Academic Staff\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("Lecturer"))
                    .andExpect(jsonPath("$.category").value("Academic Staff"))
                    .andReturn().getResponse().getContentAsString();
            String designationId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate name (case-insensitive) rejected.
            mockMvc.perform(post("/api/staff-designations")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"lecturer\",\"description\":\"dup\",\"category\":\"Academic Staff\"}"))
                    .andExpect(status().isConflict());

            // Edit.
            mockMvc.perform(patch("/api/staff-designations/" + designationId)
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"description\":\"Updated description\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.description").value("Updated description"))
                    .andExpect(jsonPath("$.name").value("Lecturer"));

            // Institution B must not see institution A's designation.
            String listForB = mockMvc.perform(get("/api/staff-designations")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(designationId));

            // Archive + restore round trip.
            mockMvc.perform(post("/api/staff-designations/" + designationId + "/archive")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/staff-designations")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(designationId));
            mockMvc.perform(post("/api/staff-designations/" + designationId + "/restore")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").doesNotExist());
            String listAfterRestore = mockMvc.perform(get("/api/staff-designations")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(listAfterRestore.contains(designationId));
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
                         "adminUser":"Test Admin","adminEmail":"admin@staffdesigtestuniversity.edu.ng"}
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
                        {"firstName":"StaffDesig","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"StaffDesigTest@2026",
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

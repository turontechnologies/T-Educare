package com.teducare.school;

import static org.junit.jupiter.api.Assertions.assertFalse;
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
class SchoolControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void fullSchoolLifecycleIncludingDuplicateRejectionAndArchiveRestore() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionId = createInstitution(superToken, "School Test University " + suffix);
        String username = "school_admin_" + suffix;
        String userManagerId = null;

        try {
            userManagerId = createUserManager(superToken, institutionId, username, "school_" + suffix);
            String token = loginAs(username, "SchoolTest@2026");

            String createResponse = mockMvc.perform(post("/api/schools")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"name":"School of Engineering","headName":"Alh. Mustapha George","designation":"HOD"}
                            """))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("School of Engineering"))
                    .andExpect(jsonPath("$.archivedAt").doesNotExist())
                    .andReturn().getResponse().getContentAsString();
            String schoolId = createResponse.split("\"id\":\"")[1].split("\"")[0];

            // Duplicate name (case-insensitive) rejected.
            mockMvc.perform(post("/api/schools")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"name":"school of engineering","headName":"Someone Else","designation":"HOD"}
                            """))
                    .andExpect(status().isConflict());

            // Missing required fields rejected.
            mockMvc.perform(post("/api/schools")
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"name":"","headName":"","designation":""}
                            """))
                    .andExpect(status().isBadRequest());

            // Edit.
            mockMvc.perform(patch("/api/schools/" + schoolId)
                    .header("Authorization", "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"headName\":\"Prof. New Head\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.headName").value("Prof. New Head"))
                    .andExpect(jsonPath("$.name").value("School of Engineering"));

            // Archive + restore round trip.
            mockMvc.perform(post("/api/schools/" + schoolId + "/archive")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.archivedAt").exists());
            String listWithoutArchived = mockMvc.perform(get("/api/schools")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listWithoutArchived.contains(schoolId));
            String listWithArchived = mockMvc.perform(get("/api/schools?includeArchived=true")
                    .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            org.junit.jupiter.api.Assertions.assertTrue(listWithArchived.contains(schoolId));
            mockMvc.perform(post("/api/schools/" + schoolId + "/restore")
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
    void schoolsAreScopedToTheCallersOwnInstitutionOnly() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "School Isolation A " + suffix);
        String institutionBId = createInstitution(superToken, "School Isolation B " + suffix);
        String usernameA = "school_iso_a_" + suffix;
        String usernameB = "school_iso_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "school_iso_a_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "school_iso_b_" + suffix);
            String tokenA = loginAs(usernameA, "SchoolTest@2026");
            String tokenB = loginAs(usernameB, "SchoolTest@2026");

            String schoolResponse = mockMvc.perform(post("/api/schools")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""
                            {"name":"School of Isolation","headName":"Someone","designation":"HOD"}
                            """))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString();
            String schoolId = schoolResponse.split("\"id\":\"")[1].split("\"")[0];

            String listForB = mockMvc.perform(get("/api/schools")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertFalse(listForB.contains(schoolId), "Institution B must not see Institution A's school");

            mockMvc.perform(patch("/api/schools/" + schoolId)
                    .header("Authorization", "Bearer " + tokenB)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Hijacked\"}"))
                    .andExpect(status().isNotFound());

            String superAdminToken = loginAs("super_admin", "Super@2024");
            mockMvc.perform(get("/api/schools")
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
                         "adminUser":"Test Admin","adminEmail":"admin@schooltestuniversity.edu.ng"}
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
                        {"firstName":"School","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"SchoolTest@2026",
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

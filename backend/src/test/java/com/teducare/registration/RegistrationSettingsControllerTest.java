package com.teducare.registration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class RegistrationSettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void defaultsThenPersistsWholesaleUpdateScopedToOwnInstitution() throws Exception {
        String superToken = loginAs("super_admin", "Super@2024");
        String suffix = String.valueOf(System.currentTimeMillis());
        String institutionAId = createInstitution(superToken, "Reg Settings Test A " + suffix);
        String institutionBId = createInstitution(superToken, "Reg Settings Test B " + suffix);
        String usernameA = "regsettings_a_" + suffix;
        String usernameB = "regsettings_b_" + suffix;
        String userManagerAId = null;
        String userManagerBId = null;

        try {
            userManagerAId = createUserManager(superToken, institutionAId, usernameA, "regsettings_a_" + suffix);
            userManagerBId = createUserManager(superToken, institutionBId, usernameB, "regsettings_b_" + suffix);
            String tokenA = loginAs(usernameA, "RegSettingsTest@2026");
            String tokenB = loginAs(usernameB, "RegSettingsTest@2026");

            // Defaults before any PUT.
            mockMvc.perform(get("/api/registration-settings")
                    .header("Authorization", "Bearer " + tokenA))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.requireCarryoverClearance").value(true))
                    .andExpect(jsonPath("$.maxUnitsPerSemester").value(24));

            mockMvc.perform(put("/api/registration-settings")
                    .header("Authorization", "Bearer " + tokenA)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"requireCarryoverClearance\":false,\"maxUnitsPerSemester\":30}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.requireCarryoverClearance").value(false))
                    .andExpect(jsonPath("$.maxUnitsPerSemester").value(30));

            // Institution B's settings remain untouched/still-default.
            mockMvc.perform(get("/api/registration-settings")
                    .header("Authorization", "Bearer " + tokenB))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.requireCarryoverClearance").value(true))
                    .andExpect(jsonPath("$.maxUnitsPerSemester").value(24));
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
                         "adminUser":"Test Admin","adminEmail":"admin@regsettingsuniversity.edu.ng"}
                        """.formatted(name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return response.split("\"id\":\"")[1].split("\"")[0];
    }

    private String createUserManager(String superToken, String institutionId, String username, String emailPrefix)
            throws Exception {
        String response = mockMvc.perform(post("/api/user-managers")
                .header("Authorization", "Bearer " + superToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"firstName":"RegSettings","lastName":"Test","email":"%s@example.com",
                         "username":"%s","password":"RegSettingsTest@2026",
                         "institutionId":"%s","isPrimaryAdmin":true}
                        """.formatted(emailPrefix, username, institutionId)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
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

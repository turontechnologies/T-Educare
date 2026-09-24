package com.teducare.auth;

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
class AuthControllerTest {

    private static final String AMARA_INSTITUTION_ID = "inst-ahmadubellouniversit-1";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void loginResolvesInstitutionNameAndLogoLiveFromTheRealInstitutionRecord() throws Exception {
        String superAdminToken = loginAs("super_admin", "Super@2024");

        mockMvc.perform(patch("/api/institutions/" + AMARA_INSTITUTION_ID)
                .header("Authorization", "Bearer " + superAdminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Ahmadu Bello University (Renamed)\","
                        + "\"logoUrl\":\"https://res.cloudinary.com/demo/logo.png\"}"))
                .andExpect(status().isOk());

        try {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"amara_bello\",\"password\":\"Amara@2024\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user.institutionName")
                            .value("Ahmadu Bello University (Renamed)"))
                    .andExpect(jsonPath("$.user.institutionLogoUrl")
                            .value("https://res.cloudinary.com/demo/logo.png"));
        } finally {
            mockMvc.perform(patch("/api/institutions/" + AMARA_INSTITUTION_ID)
                    .header("Authorization", "Bearer " + superAdminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Ahmadu Bello University\",\"logoUrl\":\"\"}"))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void deactivatedInstitutionCannotLogIn() throws Exception {
        String superAdminToken = loginAs("super_admin", "Super@2024");

        mockMvc.perform(patch("/api/institutions/" + AMARA_INSTITUTION_ID + "/status")
                .header("Authorization", "Bearer " + superAdminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"inactive\"}"))
                .andExpect(status().isOk());

        try {
            mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"amara_bello\",\"password\":\"Amara@2024\"}"))
                    .andExpect(status().isUnauthorized());
        } finally {
            mockMvc.perform(patch("/api/institutions/" + AMARA_INSTITUTION_ID + "/status")
                    .header("Authorization", "Bearer " + superAdminToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"status\":\"active\"}"))
                    .andExpect(status().isOk());
        }

        // Confirm the account works again now that the institution is reactivated.
        loginAs("amara_bello", "Amara@2024");
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
